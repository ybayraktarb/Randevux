"use server"

import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeaveType = "full_day" | "partial"
export type LeaveStatus = "pending" | "approved" | "rejected"

export type LeaveRecord = {
    id: string
    staff_business_id: string
    request_type: LeaveType
    date: string
    start_time: string | null
    end_time: string | null
    reason: string | null
    status: LeaveStatus
    reviewed_at: string | null
    created_at: string
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Patron tarafından, personelin belirli bir tarih için izin/kapalı gün ekler.
 * RPC üzerinden çalışır — Direkt "approved" olarak oluşturulur.
 */
export async function addStaffLeaveAction(params: {
    staffBusinessId: string
    requestType: LeaveType
    date: string               // YYYY-MM-DD
    startTime?: string | null  // HH:MM (partial için)
    endTime?: string | null
    reason?: string
}) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.rpc("owner_add_staff_leave", {
            p_staff_business_id: params.staffBusinessId,
            p_request_type: params.requestType,
            p_date: params.date,
            p_start_time: params.startTime || null,
            p_end_time: params.endTime || null,
            p_reason: params.reason || null,
        })

        if (error) {
            Sentry.captureException(error, { tags: { module: 'staff', action: 'addStaffLeaveAction' } })
            return { success: false, error: { message: error.message || "İzin eklenemedi." } }
        }

        revalidatePath("/(patron)/[business_id]/staff/[staff_id]", "page")
        return { success: true }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: { message: "Beklenmedik bir hata oluştu." } }
    }
}

/**
 * Bir izin talebini siler (Patron/sistem tarafından).
 */
export async function removeStaffLeaveAction(leaveId: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from("leave_requests")
            .delete()
            .eq("id", leaveId)

        if (error) {
            Sentry.captureException(error, { tags: { module: 'staff', action: 'removeStaffLeaveAction' } })
            return { success: false, error: { message: "İzin silinemedi." } }
        }

        revalidatePath("/(patron)/[business_id]/staff/[staff_id]", "page")
        return { success: true }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: { message: "Beklenmedik bir hata oluştu." } }
    }
}

/**
 * Patronun personel için tanımladığı tüm izinleri listeler.
 */
export async function getStaffLeavesAction(staffBusinessId: string): Promise<{
    success: boolean
    data?: LeaveRecord[]
    error?: { message: string }
}> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("leave_requests")
            .select("*")
            .eq("staff_business_id", staffBusinessId)
            .order("date", { ascending: false })

        if (error) {
            return { success: false, error: { message: error.message } }
        }

        return { success: true, data: (data || []) as LeaveRecord[] }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: { message: "İzinler yüklenemedi." } }
    }
}

/**
 * Bir izin talebini onaylar veya reddeder.
 */
export async function reviewStaffLeaveAction(leaveId: string, status: "approved" | "rejected") {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from("leave_requests")
            .update({
                status,
                reviewed_at: new Date().toISOString()
            })
            .eq("id", leaveId)

        if (error) {
            Sentry.captureException(error, { tags: { module: 'staff', action: 'reviewStaffLeaveAction' } })
            return { success: false, error: { message: "İzin durumu güncellenemedi." } }
        }

        revalidatePath("/(patron)/[business_id]/staff/[staff_id]", "page")
        return { success: true }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: { message: "Beklenmedik bir hata oluştu." } }
    }
}
