"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type BusinessAnnouncement = {
    id: string
    business_id: string
    title: string
    content: string | null
    image_url: string | null
    start_date: string | null
    end_date: string | null
    is_active: boolean
    priority: number
}

/**
 * Aktif ve tarih aralığı uygun duyuruları getirir (Müşteri için)
 */
export async function getActiveAnnouncementsAction(businessId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("business_announcements")
        .select("*")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as BusinessAnnouncement[] }
}

/**
 * İşletmenin TÜM duyurularını getirir (Patron Yönetimi için)
 */
export async function getAllAnnouncementsAction(businessId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("business_announcements")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as BusinessAnnouncement[] }
}

/**
 * Duyuru ekler veya günceller
 */
export async function upsertAnnouncementAction(announcement: Partial<BusinessAnnouncement>) {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Yetkisiz erişim" }

    // Ensure business_id is present
    if (!announcement.business_id) return { success: false, error: "İşletme kimliği eksik" }

    const { data, error } = await supabase
        .from("business_announcements")
        .upsert(announcement)
        .select()
        .single()

    if (error) {
        console.error("Announcement Upsert Error:", error)
        return { success: false, error: error.message }
    }
    
    revalidatePath("/(patron)/ayarlar")
    return { success: true, data: data as BusinessAnnouncement }
}

/**
 * Duyuru siler
 */
export async function deleteAnnouncementAction(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from("business_announcements")
        .delete()
        .eq("id", id)

    if (error) return { success: false, error: error.message }
    
    revalidatePath("/(patron)/ayarlar")
    return { success: true }
}
