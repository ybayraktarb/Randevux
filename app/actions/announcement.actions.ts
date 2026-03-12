"use server"

import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface PlatformAnnouncement {
    id: string
    title: string
    content: string
    type: 'info' | 'warning' | 'danger' | 'success'
    target_role: 'all' | 'patron' | 'staff'
    target_sector_id?: string | null
    is_active: boolean
    starts_at?: string | null
    ends_at?: string | null
    created_at: string
}

export interface BusinessAnnouncement {
    id: string
    business_id: string
    title: string
    content: string | null
    image_url: string | null
    start_date: string | null
    end_date: string | null
    is_active: boolean
    priority: number
    created_at: string
}

// ─── PLATFORM ANNOUNCEMENTS (Super Admin) ────────────────────────────────────

/**
 * Tüm platform duyurularını getirir (Süper Admin için).
 */
export async function getPlatformAnnouncementsAction() {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")
        const supabase = await createClient()
        
        const { data, error } = await supabase
            .from("platform_announcements")
            .select(`
                *,
                module:modules(display_name)
            `)
            .order("created_at", { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

/**
 * Yeni bir platform duyurusu oluşturur.
 */
export async function createPlatformAnnouncementAction(payload: Omit<PlatformAnnouncement, 'id' | 'created_at'>) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")
        const supabase = await createClient()

        const { error } = await supabase
            .from("platform_announcements")
            .insert(payload)

        if (error) throw error
        
        revalidatePath("/super-admin")
        revalidatePath("/", "layout")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

/**
 * Mevcut bir platform duyurusunu günceller.
 */
export async function updatePlatformAnnouncementAction(id: string, payload: Partial<PlatformAnnouncement>) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")
        const supabase = await createClient()

        const { error } = await supabase
            .from("platform_announcements")
            .update(payload)
            .eq("id", id)

        if (error) throw error
        
        revalidatePath("/super-admin")
        revalidatePath("/", "layout")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

/**
 * Bir platform duyurusunu siler.
 */
export async function deletePlatformAnnouncementAction(id: string) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")
        const supabase = await createClient()

        const { error } = await supabase
            .from("platform_announcements")
            .delete()
            .eq("id", id)

        if (error) throw error
        
        revalidatePath("/super-admin")
        revalidatePath("/", "layout")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

/**
 * Kullanıcı için geçerli (aktif) platform duyurularını getirir.
 */
export async function getActivePlatformAnnouncementsAction() {
    try {
        const supabase = await createClient()
        
        const { data, error } = await supabase
            .from("platform_announcements")
            .select("*")
            .eq("is_active", true)
            .lte("starts_at", new Date().toISOString())
            .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)

        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─── BUSINESS ANNOUNCEMENTS (Patron) ─────────────────────────────────────────

/**
 * Belirli bir işletmenin tüm duyurularını getirir.
 */
export async function getAllAnnouncementsAction(businessId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("business_announcements")
            .select("*")
            .eq("business_id", businessId)
            .order("created_at", { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

/**
 * İşletme duyurusu oluşturur veya günceller.
 */
export async function upsertAnnouncementAction(payload: any) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("business_announcements")
            .upsert(payload)

        if (error) throw error
        
        revalidatePath("/ayarlar")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

/**
 * İşletme duyurusunu siler.
 */
export async function deleteAnnouncementAction(id: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("business_announcements")
            .delete()
            .eq("id", id)

        if (error) throw error
        
        revalidatePath("/ayarlar")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

/**
 * Belirli bir işletmenin aktif duyurularını getirir (Müşteri ekranı için).
 */
export async function getActiveAnnouncementsAction(businessId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("business_announcements")
            .select("*")
            .eq("business_id", businessId)
            .eq("is_active", true)
            .lte("start_date", new Date().toISOString())
            .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
            .order("priority", { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}
