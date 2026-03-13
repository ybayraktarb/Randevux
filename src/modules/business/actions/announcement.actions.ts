"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

export interface AnnouncementInput {
  id?: string
  business_id: string
  title: string
  content: string
  start_date?: string
  end_date?: string
  is_active: boolean
}

export async function upsertAnnouncementAction(input: AnnouncementInput) {
  try {
    const supabase = await createClient()
    const { id, ...data } = input
    
    if (id) {
      const { error } = await supabase.from("business_announcements").update(data).eq("id", id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await supabase.from("business_announcements").insert(data)
      if (error) return { success: false, error: error.message }
    }

    revalidatePath("/ayarlar")
    return { success: true }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Duyuru kaydedilemedi." }
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("business_announcements").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    
    revalidatePath("/ayarlar")
    return { success: true }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Duyuru silinemedi." }
  }
}

export async function getAnnouncementsAction(businessId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("business_announcements")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message, data: [] }
    return { success: true, data: data || [] }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Duyurular yüklenemedi.", data: [] }
  }
}
export async function getActiveAnnouncementsAction(businessId: string) {
    try {
        const supabase = await createClient()
        const now = new Date().toISOString()
        const { data, error } = await supabase
            .from("business_announcements")
            .select("*")
            .eq("business_id", businessId)
            .eq("is_active", true)
            .lte("start_date", now)
            .or(`end_date.is.null,end_date.gt.${now}`)
        
        if (error) throw error
        return { success: true, data: data || [] }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: "Duyurular yüklenemedi.", data: [] }
    }
}

export type BusinessAnnouncement = {
    id: string
    title: string
    content: string
    start_date: string
    end_date: string | null
    is_active: boolean
    business_id: string
}

// ─── Platform Announcements (Super Admin) ───────────────────────────────────

export interface PlatformAnnouncement {
    id: string
    title: string
    content: string
    type: "info" | "warning" | "danger" | "success"
    target_role: "all" | "patron" | "staff"
    target_sector_id: string | null
    is_active: boolean
    starts_at: string
    ends_at: string | null
    created_at: string
}

export async function createPlatformAnnouncementAction(data: any) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from("platform_announcements").insert(data)
        if (error) throw error
        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

export async function updatePlatformAnnouncementAction(id: string, data: any) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from("platform_announcements").update(data).eq("id", id)
        if (error) throw error
        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

export async function getPlatformAnnouncementsAction() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.from("platform_announcements").select("*").order("created_at", { ascending: false })
        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message, data: [] }
    }
}

export async function getActivePlatformAnnouncementsAction() {
    try {
        const supabase = await createClient()
        const now = new Date().toISOString()
        const { data, error } = await supabase
            .from("platform_announcements")
            .select("*")
            .eq("is_active", true)
            .lte("starts_at", now)
            .or(`ends_at.is.null,ends_at.gt.${now}`)
        
        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message, data: [] }
    }
}

export async function deletePlatformAnnouncementAction(id: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from("platform_announcements").delete().eq("id", id)
        if (error) throw error
        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}
