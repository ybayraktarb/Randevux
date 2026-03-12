"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"
import { createClient as createClientJS } from "@supabase/supabase-js"
import type { ActionResult } from "@/lib/validations/action-types"

const supabaseAdmin = createClientJS(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * İşletmeyi favorilere ekler veya çıkarır
 */
export async function toggleFavoriteAction(businessId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        const { data: existing } = await supabase
            .from("user_favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("business_id", businessId)
            .maybeSingle()

        if (existing) {
            const { error } = await supabase
                .from("user_favorites")
                .delete()
                .eq("id", existing.id)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from("user_favorites")
                .insert({
                    user_id: user.id,
                    business_id: businessId
                })
            if (error) throw error
        }

        revalidatePath("/musteri/dashboard")
        revalidatePath(`/isletme/${businessId}`)

        return { success: true, isFavorite: !existing }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "İşlem başarısız oldu." }
    }
}

/**
 * İşletme için değerlendirme/yorum ekler
 */
export async function addReviewAction(
    businessId: string,
    rating: number,
    comment: string,
    appointmentId?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        const { error } = await supabase
            .from("business_reviews")
            .insert({
                business_id: businessId,
                user_id: user.id,
                appointment_id: appointmentId,
                rating,
                comment
            })

        if (error) throw error

        revalidatePath(`/isletme/${businessId}`)

        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Yorum eklenirken bir hata oluştu." }
    }
}

/**
 * İşletme vitrini (storefront) için gerekli tüm verileri tek seferde getirir.
 */
export async function getBusinessStorefrontAction(businessId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const [
            businessRes,
            servicesRes,
            staffRes,
            staffServicesRes, // NEW: Fetch staff services
            hoursRes,
            reviewsRes,
            favoriteRes,
            connectionRes,
            announcementsRes
        ] = await Promise.all([
            supabase.from("businesses").select("*, module:modules(display_name)").eq("id", businessId).single(),
            supabase.from("services").select("*").eq("business_id", businessId).eq("is_active", true).order("category"),
            supabase.from("staff_business").select("*, user:users(id, name, avatar_url)").eq("business_id", businessId).eq("is_active", true),
            supabase.from("staff_services").select("staff_business_id, service_id").eq("is_active", true), // NEW: Only active staff services
            supabase.from("business_hours").select("*").eq("business_id", businessId).order("day_of_week"),
            supabase.from("business_reviews").select("*, user:users(name, avatar_url)").eq("business_id", businessId).order("created_at", { ascending: false }).limit(10),
            user ? supabase.from("user_favorites").select("id").eq("business_id", businessId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
            user ? supabase.from("business_customers").select("id").eq("business_id", businessId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
            supabase
                .from("business_announcements")
                .select("*")
                .eq("business_id", businessId)
                .eq("is_active", true)
                .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
                .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
                .order("priority", { ascending: false })
                .order("created_at", { ascending: false })
        ])

        if (businessRes.error) throw businessRes.error
        if (servicesRes.error) {
            console.error("Services Fetch Error Details:", JSON.stringify(servicesRes.error, null, 2))
        }
        if (staffRes.error) {
            console.error("Staff Fetch Error Details:", JSON.stringify(staffRes.error, null, 2))
        }
        if (hoursRes.error) {
            console.error("Hours Fetch Error Details:", JSON.stringify(hoursRes.error, null, 2))
        }

        const business = businessRes.data
        const ratings = reviewsRes.data?.map(r => r.rating) || []
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5.0

        // Create a map of staff to their service IDs
        const staffSvcMap: Record<string, string[]> = {}
        if (staffServicesRes.data) {
            staffServicesRes.data.forEach((ss: any) => {
                if (!staffSvcMap[ss.staff_business_id]) staffSvcMap[ss.staff_business_id] = []
                staffSvcMap[ss.staff_business_id].push(ss.service_id)
            })
        }

        return {
            success: true,
            data: {
                business: {
                    id: business.id,
                    name: business.name,
                    category: business.module?.display_name || "Genel",
                    address: business.address || "",
                    phone: business.phone || "",
                    logo_url: business.logo_url,
                    description: business.description || "",
                    isFavorite: !!favoriteRes.data,
                    isConnected: !!connectionRes.data,
                    averageRating: Number(avgRating.toFixed(1)),
                    reviewCount: ratings.length
                },
                services: (servicesRes.data || []).map(s => ({
                    id: s.id,
                    name: s.name,
                    duration: `${s.base_duration_minutes} dk`,
                    price: Number(s.base_price) || 0,
                    priceLabel: `${s.base_price} ₺`,
                    category: s.category || "Genel",
                    rawDuration: s.base_duration_minutes || 0
                })),
                staff: (staffRes.data || []).map(s => ({
                    id: s.id,
                    name: s.user?.name || "Personel",
                    specialty: s.role === 'manager' ? "İşletme Müdürü" : "Uzman",
                    avatar_url: s.user?.avatar_url,
                    serviceIds: staffSvcMap[s.id] || [], // NEW: Attached service IDs
                    rating: "5.0",
                    online: true
                })),
                workingHours: (hoursRes.data || []).map(h => {
                    const dayNames: Record<number, string> = {
                        1: "Pazartesi", 2: "Salı", 3: "Çarşamba", 4: "Perşembe", 5: "Cuma", 6: "Cumartesi", 0: "Pazar"
                    }
                    return {
                        day: dayNames[h.day_of_week] || "Gün",
                        hours: h.is_closed ? "Kapalı" : `${String(h.open_time).slice(0, 5)} - ${String(h.close_time).slice(0, 5)}`,
                        isClosed: h.is_closed,
                        dayOfWeek: h.day_of_week
                    }
                }),
                reviews: (reviewsRes.data || []).map(r => ({
                    id: r.id,
                    userName: r.user?.name || "Müşteri",
                    avatarUrl: r.user?.avatar_url,
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.created_at
                })),
                announcements: announcementsRes.data || []
            }
        }
    } catch (err: any) {
        console.error("getBusinessStorefrontAction Critical Error:", {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint
        })
        Sentry.captureException(err)
        return { success: false, error: err.message || "İşletme verileri yüklenemedi." }
    }
}

/**
 * Yeni bir işletmeyi (ve gerekirse yeni patronunu) "Single-Source-of-Truth" mantığıyla kurar.
 * 1. Eğer yeni patronsa -> Admin API ile hesabı oluşturur, ID'sini alır.
 * 2. Patron ID'si ile "onboard_business" RPC fonksiyonunu çağırıp işletme, saatler, paket, çalışan atamasını atomic yapar.
 */
export async function atomicOnboardAction(payload: {
    isNewOwner: boolean,
    ownerId?: string,
    newOwnerData?: { name: string, email: string, password: string },
    businessData: {
        name: string,
        moduleId: string,
        packageId: string,
        city: string,
        phone: string,
        description: string,
        onboardingStatus: string
    }
}): Promise<ActionResult<{ businessId: string }>> {
    try {
        let finalOwnerId = payload.ownerId

        // 1. Yeni Patron İstenmişse: Supabase Admin ile hesabı oluştur!
        if (payload.isNewOwner) {
            if (!payload.newOwnerData) {
                return { success: false, error: { message: "Yeni patron verileri eksik!" } }
            }
            const { name, email, password } = payload.newOwnerData
            
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name }
            })

            if (authError || !authData?.user) {
                console.error("Kullanıcı oluşturma hatası:", authError)
                return { success: false, error: { message: authError?.message || "Patron hesabı oluşturulamadı. E-posta kullanımda olabilir." } }
            }
            
            finalOwnerId = authData.user.id

            // Trigger'ların oturması için çok kısa bir an bekle (user tablosuna insert)
            await new Promise(resolve => setTimeout(resolve, 300))

            // Yeni patron olduğunu belli etmek için role güncelle
            const { error: roleError } = await supabaseAdmin.from('users').update({ role: 'patron' }).eq('id', finalOwnerId)
            if (roleError) {
                console.error("atomicOnboardAction: Role update error:", roleError)
                // Hata kritik olabilir veya olmayabilir, ama loglamak önemli.
            }
        }

        if (!finalOwnerId) {
            return { success: false, error: { message: "Geçerli bir İşletme Sahibi (Patron) bulunamadı veya oluşturulamadı." } }
        }

        // 2. İşletmeyi Kur (Atomik RPC Çağrısı)
        const { data: businessId, error: rpcError } = await supabaseAdmin.rpc("onboard_business", {
            p_owner_user_id: finalOwnerId,
            p_business_name: payload.businessData.name,
            p_sector_id: payload.businessData.moduleId,
            p_package_id: payload.businessData.packageId,
            p_metadata: {
                city: payload.businessData.city,
                phone: payload.businessData.phone,
                description: payload.businessData.description
            },
            p_onboarding_status: payload.businessData.onboardingStatus,
        })

        if (rpcError || !businessId) {
            console.error("Onboard RPC Hatası:", rpcError)
            
            // Not: Eğer yeni kullanıcı oluşturup RPC'de hata alırsak, kullanıcı DB'de kalır. 
            // Gelecekte bir Cleanup mekanizması (veya RPC ile Auth'u aynı Edge function içine alma) düşünülebilir.
            
            // Eğer isNewOwner ise ve işletme işi yattıysa, admin yetkisiyle hesabı silebiliriz (Rollback)
            if (payload.isNewOwner && finalOwnerId) {
                 await supabaseAdmin.auth.admin.deleteUser(finalOwnerId).catch(console.error)
            }
            throw new Error(rpcError?.message || "İşletme kurulum RPC fonksiyonu başarısız oldu.")
        }

        revalidatePath("/super-admin") // Super admin tablosunu yenile
        
        return { success: true, data: { businessId } }

    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message || "Bilinmeyen bir hata oluştu." } }
    }
}

/**
 * İşletmenin aktiflik durumunu değiştirir (Soft-delete desteğiyle).
 * Sadece Super Admin yetkisiyle çalıştırılmalıdır.
 */
export async function toggleBusinessActiveAction(businessId: string, isActive: boolean): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient()
        
        // 1. Yetki Kontrolü
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: { message: "Oturum açılmamış." } }
        
        const { data: sa } = await supabase.from("users").select("role").eq("id", user.id).single()
        if (sa?.role !== "super_admin") {
            return { success: false, error: { message: "Bu işlem için yetkiniz yok." } }
        }

        // 2. Güncelleme
        const updateData: any = { is_active: isActive }
        if (!isActive) {
            updateData.deleted_at = new Date().toISOString()
        } else {
            updateData.deleted_at = null
        }

        const { error } = await supabase
            .from("businesses")
            .update(updateData)
            .eq("id", businessId)

        if (error) throw error

        revalidatePath("/super-admin")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message || "İşletme durumu güncellenemedi." } }
    }
}

/**
 * İşletmeyi ve tüm verilerini KALICI OLARAK siler (Hard-delete).
 * Sadece Super Admin yetkisiyle çalıştırılmalıdır.
 */
export async function deleteBusinessAction(businessId: string): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient()
        
        // 1. Yetki Kontrolü
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: { message: "Oturum açılmamış." } }
        
        const { data: sa } = await supabase.from("users").select("role").eq("id", user.id).single()
        if (sa?.role !== "super_admin") {
            return { success: false, error: { message: "Bu işlem için yetkiniz yok." } }
        }

        // 2. RPC ile kalıcı silme
        const { error } = await supabase.rpc("hard_delete_business", {
            p_business_id: businessId
        })

        if (error) throw error

        revalidatePath("/super-admin")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message || "İşletme silinemedi." } }
    }
}
/**
 * İşletme için aktif/enabled olan özelliklerin anahtarlarını (key) döner.
 */
export async function getEnabledFeaturesAction(businessId: string): Promise<ActionResult<string[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("business_features")
            .select("feature:features(key)")
            .eq("business_id", businessId)
            .eq("is_enabled", true)

        if (error) throw error

        const keys = (data || []).map((f: any) => f.feature?.key).filter(Boolean)
        return { success: true, data: keys }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message || "Özellikler alınamadı." } }
    }
}
/**
 * İşletmenin mevcut abonelik bilgilerini getirir.
 */
export async function getSubscriptionAction(businessId: string): Promise<ActionResult<{
    status: string,
    startsAt: string,
    endsAt: string | null,
    daysRemaining: number | null
}>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("subscriptions")
            .select("status, starts_at, ends_at")
            .eq("business_id", businessId)
            .maybeSingle()

        if (error) throw error
        if (!data) return { success: false, error: { message: "Abonelik bulunamadı." } }

        let daysRemaining = null
        if (data.ends_at) {
            const end = new Date(data.ends_at)
            const now = new Date()
            const diffTime = end.getTime() - now.getTime()
            daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        }

        return {
            success: true,
            data: {
                status: data.status,
                startsAt: data.starts_at,
                endsAt: data.ends_at,
                daysRemaining
            }
        }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message || "Abonelik bilgileri alınamadı." } }
    }
}

