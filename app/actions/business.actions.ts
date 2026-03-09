"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

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
