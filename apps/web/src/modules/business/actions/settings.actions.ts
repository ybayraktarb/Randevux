"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"
import { revalidatePath } from "next/cache"

// ─── Closed Dates Actions ────────────────────────────────────────────────────

export async function addClosedDateAction(businessId: string, date: string, reason?: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("business_closed_dates")
      .insert({ business_id: businessId, date, reason: reason || null })

    if (error) return { success: false, error: error.message }
    revalidatePath("/ayarlar")
    return { success: true }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Kapalı gün eklenemedi." }
  }
}

export async function removeClosedDateAction(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("business_closed_dates")
      .delete()
      .eq("id", id)

    if (error) return { success: false, error: error.message }
    revalidatePath("/ayarlar")
    return { success: true }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Kapalı gün silinemedi." }
  }
}

export async function getClosedDatesAction(businessId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("business_closed_dates")
      .select("*")
      .eq("business_id", businessId)
      .order("date", { ascending: true })

    if (error) return { success: false, error: error.message, data: [] }
    return { success: true, data: data || [] }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Veriler yüklenemedi.", data: [] }
  }
}

// ─── Business Hours Actions ──────────────────────────────────────────────────

export interface BusinessHourInput {
  day_of_week: number
  open_time: string
  close_time: string
  is_open: boolean
}

export async function upsertBusinessHoursAction(businessId: string, hours: BusinessHourInput[]) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc("upsert_business_hours", {
      p_business_id: businessId,
      p_hours: hours,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath("/ayarlar")
    return { success: true }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Saatler güncellenemedi." }
  }
}

export async function getBusinessHoursAction(businessId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("business_hours")
      .select("day_of_week, open_time, close_time, is_open")
      .eq("business_id", businessId)
      .order("day_of_week")

    if (error) return { success: false, error: error.message, data: [] }
    return { success: true, data: (data || []) as BusinessHourInput[] }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Hizmet saatleri yüklenemedi.", data: [] }
  }
}
