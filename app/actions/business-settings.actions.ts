"use server"

import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"

// ─── Business Closed Dates ────────────────────────────────────────────────────

export async function addClosedDateAction(businessId: string, date: string, reason?: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("business_closed_dates")
            .insert({ business_id: businessId, date, reason: reason || null })

        if (error) return { success: false, error: { message: error.message } }
        return { success: true }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: { message: "Kapalı gün eklenemedi." } }
    }
}

export async function removeClosedDateAction(closedDateId: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("business_closed_dates")
            .delete()
            .eq("id", closedDateId)

        if (error) return { success: false, error: { message: error.message } }
        return { success: true }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: { message: "Kapalı gün silinemedi." } }
    }
}

export async function getClosedDatesAction(businessId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("business_closed_dates")
            .select("id, date, reason")
            .eq("business_id", businessId)
            .order("date", { ascending: true })

        if (error) return { success: false, error: { message: error.message }, data: [] }
        return { success: true, data: data || [] }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: { message: "Kapalı günler yüklenemedi." }, data: [] }
    }
}

// ─── Business Hours ───────────────────────────────────────────────────────────

export type BusinessHour = {
    day_of_week: number
    open_time: string
    close_time: string
    is_open: boolean
}

export async function upsertBusinessHoursAction(businessId: string, hours: BusinessHour[]) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.rpc("upsert_business_hours", {
            p_business_id: businessId,
            p_hours: hours,
        })

        if (error) return { success: false, error: { message: error.message } }
        return { success: true }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: { message: "Çalışma saatleri güncellenemedi." } }
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

        if (error) return { success: false, error: { message: error.message }, data: [] }
        return { success: true, data: (data || []) as BusinessHour[] }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: { message: "İş saatleri yüklenemedi." }, data: [] }
    }
}
