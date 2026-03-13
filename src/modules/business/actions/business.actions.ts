"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"
import { BusinessService } from "@/src/modules/business/services/business.service"
import { ServiceConfigService } from "@/src/modules/business/services/service.service"
import { 
  businessProfileSchema, 
  appointmentPolicySchema, 
  serviceSchema 
} from "../types"
import type { 
  BusinessProfileInput, 
  AppointmentPolicyInput, 
  ServiceInput 
} from "../types"
import { revalidatePath } from "next/cache"
import { checkFeatureAccess, isSuperAdmin } from "@/lib/permissions"
import { logAuditAction } from "@/src/modules/admin/actions/audit.actions"
import { createNotificationAction } from "@/src/modules/core/actions/notification.actions"

export async function toggleBusinessActiveAction(businessId: string, isActive: boolean) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")
        const supabase = await createClient()
        const { error } = await supabase.from("businesses").update({ is_active: isActive }).eq("id", businessId)
        if (error) throw error
        
        await logAuditAction({
            action: isActive ? "updated" : "deleted", // Or just "updated"
            targetTable: "businesses",
            targetId: businessId
        })

        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

export async function atomicOnboardAction(payload: any) {
  try {
    if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

    const supabase = await createClient()
    const { isNewOwner, ownerId, newOwnerData, businessData } = payload

    let finalOwnerId = ownerId

    if (isNewOwner) {
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: newOwnerData.email,
        password: newOwnerData.password,
        email_confirm: true,
        user_metadata: { name: newOwnerData.name }
      })
      if (authErr) throw authErr
      finalOwnerId = authUser.user.id

      const { error: profileErr } = await supabase.from("users").insert({
        id: finalOwnerId,
        name: newOwnerData.name,
        email: newOwnerData.email,
        role: "patron"
      })
      if (profileErr) throw profileErr
    }

    const { data: business, error: bizErr } = await supabase.from("businesses").insert({
      name: businessData.name,
      city: businessData.city,
      phone: businessData.phone,
      description: businessData.description,
      onboarding_status: businessData.onboardingStatus,
      is_active: true
    }).select().single()

    if (bizErr) throw bizErr

    const { error: ownerLinkErr } = await supabase.from("business_owners").insert({
      business_id: business.id,
      user_id: finalOwnerId
    })
    if (ownerLinkErr) throw ownerLinkErr

    await supabase.from("businesses").update({
      package_id: businessData.packageId
    }).eq("id", business.id)

    await logAuditAction({
      action: "onboarded",
      targetTable: "businesses",
      targetId: business.id
    })

    revalidatePath("/admin-dashboard")
    return { success: true, data: { businessId: business.id } }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: err.message || "Onboarding failure" } }
  }
}

export async function toggleFavoriteAction(businessId: string, isFavorite?: boolean) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        let newState = isFavorite
        if (newState === undefined) {
             const { data: existing } = await supabase.from("user_favorites").select("*").eq("user_id", user.id).eq("business_id", businessId).maybeSingle()
             newState = !existing
        }

        if (newState) {
            await supabase.from("user_favorites").upsert({ user_id: user.id, business_id: businessId })
        } else {
            await supabase.from("user_favorites").delete().eq("user_id", user.id).eq("business_id", businessId)
        }

        return { success: true, isFavorite: newState }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

export async function deleteBusinessAction(id: string) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")
        const supabase = await createClient()
        
        const { error } = await supabase.from("businesses").delete().eq("id", id)
        if (error) throw error
        
        await logAuditAction({
            action: "deleted",
            targetTable: "businesses",
            targetId: id
        })

        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message } }
    }
}

export async function addReviewAction(data: any) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        const { error } = await supabase.from("reviews").insert({
            business_id: data.businessId,
            user_id: user.id,
            rating: data.rating,
            comment: data.comment,
            appointment_id: data.appointmentId
        })

        if (error) throw error
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

export async function getEnabledFeaturesAction(businessId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("business_features")
            .select("feature:features(key)")
            .eq("business_id", businessId)
            .eq("is_enabled", true)

        if (error) throw error
        return { success: true, data: data.map((f: any) => f.feature.key) }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message, data: [] }
    }
}

// ─── Business Actions ────────────────────────────────────────────────────────

export async function updateBusinessProfileAction(input: BusinessProfileInput) {
  try {
    const validated = businessProfileSchema.safeParse(input)
    if (!validated.success) return { success: false, error: validated.error.errors[0].message }
    return await BusinessService.updateProfile(validated.data)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "İşletme bilgileri güncellenemedi." }
  }
}

export async function updateAppointmentPoliciesAction(input: AppointmentPolicyInput) {
  try {
    const validated = appointmentPolicySchema.safeParse(input)
    if (!validated.success) return { success: false, error: validated.error.errors[0].message }
    return await BusinessService.updateAppointmentPolicies(validated.data)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Politikalar güncellenemedi." }
  }
}

export async function refreshInviteCodeAction(businessId: string) {
  try {
    return await BusinessService.refreshInviteCode(businessId)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Davet kodu yenilenemedi." }
  }
}

// ─── Service Actions ─────────────────────────────────────────────────────────

export async function upsertServiceAction(input: ServiceInput) {
  try {
    const validated = serviceSchema.safeParse(input)
    if (!validated.success) return { success: false, error: validated.error.errors[0].message }
    return await ServiceConfigService.upsertService(validated.data)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Hizmet kaydedilemedi." }
  }
}

export async function toggleServiceStatusAction(id: string, isActive: boolean) {
  try {
    return await ServiceConfigService.toggleServiceStatus(id, isActive)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Hizmet durumu değiştirilemedi." }
  }
}

export async function getBusinessServicesAction(businessId: string) {
  try {
    return await ServiceConfigService.getServices(businessId)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Hizmetler yüklenemedi.", data: [] }
  }
}
export async function getSubscriptionAction(businessId: string) {
    try {
        const supabase = await createClient()
        // Mocking logic or connecting to a real subscription service
        const { data, error } = await supabase.from("businesses").select("subscription_status, subscription_ends_at").eq("id", businessId).single()
        if (error) throw error
        
        const endsAt = data.subscription_ends_at ? new Date(data.subscription_ends_at) : null
        const daysRemaining = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null

        return { 
            success: true, 
            data: { 
                status: data.subscription_status || "trialing", 
                daysRemaining 
            } 
        }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}
export async function getBusinessStorefrontAction(businessId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("businesses")
            .select(`
                *,
                services(*),
                staff:staff_business(
                    *,
                    user:users(*)
                ),
                reviews(*, user:users(name, avatar_url))
            `)
            .eq("id", businessId)
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}
