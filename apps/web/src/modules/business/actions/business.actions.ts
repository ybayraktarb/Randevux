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
  ServiceInput,
  Service
} from "../types"
import { revalidatePath } from "next/cache"
import { checkFeatureAccess, isSuperAdmin } from "@/lib/permissions"
import { logAuditAction } from "@/src/modules/admin/actions/audit.actions"
import { createNotificationAction } from "@/src/modules/core/actions/notification.actions"
import type { ActionResult } from "@/lib/validations/action-types"
import { AtomicOnboardPayload, ReviewInput } from "../types"

export async function toggleBusinessActiveAction(businessId: string, isActive: boolean): Promise<ActionResult<void>> {
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
        return { success: true, data: undefined }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "İşletme durumu güncellenemedi."
        return { success: false, error: { message } }
    }
}

export async function atomicOnboardAction(payload: AtomicOnboardPayload): Promise<ActionResult<{ businessId: string }>> {
  try {
    if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

    const supabase = await createClient()
    const { isNewOwner, ownerId, newOwnerData, businessData } = payload

    let finalOwnerId = ownerId

    if (isNewOwner) {
      if (!newOwnerData) throw new Error("Yeni sahip bilgileri eksik.")
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
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Onboarding failure"
    return { success: false, error: { message } }
  }
}

export async function toggleFavoriteAction(businessId: string, isFavorite?: boolean): Promise<ActionResult<{ isFavorite: boolean }>> {
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

        return { success: true, data: { isFavorite: newState } }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Favori işlemi başarısız."
        return { success: false, error: { message } }
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
        return { success: true, data: undefined }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "İşletme silinemedi."
        return { success: false, error: { message } }
    }
}

export async function addReviewAction(data: ReviewInput): Promise<ActionResult<void>> {
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
        return { success: true, data: undefined }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Yorum eklenemedi."
        return { success: false, error: { message } }
    }
}

export async function getEnabledFeaturesAction(businessId: string): Promise<ActionResult<string[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("business_features")
            .select("feature:features(key)")
            .eq("business_id", businessId)
            .eq("is_enabled", true)

        if (error) throw error
        return { success: true, data: data.map((f: any) => f.feature.key) }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Özellikler alınamadı."
        return { success: false, error: { message } }
    }
}

// ─── Business Actions ────────────────────────────────────────────────────────

export async function updateBusinessProfileAction(input: BusinessProfileInput): Promise<ActionResult<void>> {
  try {
    const validated = businessProfileSchema.safeParse(input)
    if (!validated.success) return { success: false, error: { message: validated.error.errors[0].message } }
    const res = await BusinessService.updateProfile(validated.data)
    if (!res.success) return { success: false, error: { message: res.error || "Güncelleme hatası" } }
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "İşletme bilgileri güncellenemedi."
    return { success: false, error: { message } }
  }
}

export async function updateAppointmentPoliciesAction(input: AppointmentPolicyInput): Promise<ActionResult<void>> {
  try {
    const validated = appointmentPolicySchema.safeParse(input)
    if (!validated.success) return { success: false, error: { message: validated.error.errors[0].message } }
    const res = await BusinessService.updateAppointmentPolicies(validated.data)
    if (!res.success) return { success: false, error: { message: res.error || "Güncelleme hatası" } }
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Politikalar güncellenemedi."
    return { success: false, error: { message } }
  }
}

export async function refreshInviteCodeAction(businessId: string): Promise<ActionResult<{ newCode: string }>> {
  try {
    const res = await BusinessService.refreshInviteCode(businessId)
    if (!res.success) return { success: false, error: { message: res.error || "Hata" } }
    return { success: true, data: { newCode: res.newCode! } }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Davet kodu yenilenemedi."
    return { success: false, error: { message } }
  }
}

// ─── Service Actions ─────────────────────────────────────────────────────────

export async function upsertServiceAction(input: ServiceInput): Promise<ActionResult<void>> {
  try {
    const validated = serviceSchema.safeParse(input)
    if (!validated.success) return { success: false, error: { message: validated.error.errors[0].message } }
    const res = await ServiceConfigService.upsertService(validated.data)
    if (!res.success) return { success: false, error: { message: res.error || "Hata" } }
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Hizmet kaydedilemedi."
    return { success: false, error: { message } }
  }
}

export async function toggleServiceStatusAction(id: string, isActive: boolean): Promise<ActionResult<void>> {
  try {
    const res = await ServiceConfigService.toggleServiceStatus(id, isActive)
    if (!res.success) return { success: false, error: { message: res.error || "Hata" } }
    return { success: true }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Hizmet durumu değiştirilemedi."
    return { success: false, error: { message } }
  }
}

export async function getBusinessServicesAction(businessId: string): Promise<ActionResult<Service[]>> {
  try {
    const res = await ServiceConfigService.getServices(businessId)
    // res.data implicitly typed correctly if ServiceConfigService.getServices is typed
    return { success: true, data: res.data as Service[] } 
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Hizmetler yüklenemedi."
    return { success: false, error: { message } }
  }
}
export async function getSubscriptionAction(businessId: string): Promise<ActionResult<{ status: string; daysRemaining: number | null }>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.from("businesses").select("subscription_status, subscription_ends_at").eq("id", businessId).single()
        if (error) throw error
        
        const endsAt = data.subscription_ends_at ? new Date(data.subscription_ends_at) : null
        const daysRemaining = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null

        return { 
            success: true, 
            data: { 
                status: (data.subscription_status as string) || "trialing", 
                daysRemaining 
            } 
        }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Abonelik bilgisi alınamadı."
        return { success: false, error: { message } }
    }
}
export async function getBusinessStorefrontAction(businessId: string): Promise<ActionResult<any>> {
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
                reviews:business_reviews(
                    *,
                    user:users(name, avatar_url)
                ),
                working_hours:business_hours(*)
            `)
            .eq("id", businessId)
            .single()

        if (error) throw error

        // ─── Mapping snake_case to camelCase for the frontend ───────────────────
        const formatted = {
            business: {
                id: data.id,
                name: data.name,
                category: data.category || "Genel",
                address: data.address || "",
                phone: data.phone || "",
                logo_url: data.logo_url,
                description: data.description,
                isFavorite: false, // Will be updated on client if needed
                isConnected: true,
                averageRating: 0,
                reviewCount: 0,
                features: []
            },
            services: (data.services || []).map((s: any) => ({
                id: s.id,
                name: s.name,
                duration: `${s.base_duration_minutes} dk`,
                rawDuration: s.base_duration_minutes,
                price: s.base_price,
                priceLabel: `${s.base_price} ₺`,
                category: s.category || "Genel"
            })),
            staff: (data.staff || []).map((s: any) => ({
                id: s.id,
                name: s.user?.name || "İsimsiz",
                specialty: s.expertise_level || "Uzman",
                avatar_url: s.user?.avatar_url,
                rating: "5.0",
                online: true
            })),
            workingHours: (data.working_hours || []).map((h: any) => {
                const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
                return {
                    day: days[h.day_of_week] || "GÜN",
                    hours: `${h.start_time?.substring(0, 5)} - ${h.end_time?.substring(0, 5)}`,
                    isClosed: h.is_closed,
                    dayOfWeek: h.day_of_week
                }
            }).sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek),
            reviews: (data.reviews || []).map((r: any) => ({
                id: r.id,
                userName: r.user?.name || "Müşteri",
                avatarUrl: r.user?.avatar_url,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.created_at
            })),
            announcements: [] // Placeholder
        }

        // Calculate ratings
        if (formatted.reviews.length > 0) {
            const sum = formatted.reviews.reduce((acc: number, r: any) => acc + r.rating, 0)
            formatted.business.averageRating = Number((sum / formatted.reviews.length).toFixed(1))
            formatted.business.reviewCount = formatted.reviews.length
        }

        return { success: true, data: formatted }
    } catch (err: unknown) {
        console.error("getBusinessStorefrontAction Error:", err)
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "İşletme sayfası yüklenemedi."
        return { success: false, error: { message } }
    }
}
