"use server"

import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { AppointmentService } from "../services/appointment.service"
import type { AppointmentStatus } from "@randesk/shared"

import type { ActionResult } from "@/lib/validations/action-types"

/**
 * Randevu durumunu günceller.
 */
export async function updateAppointmentStatusAction(
    appointmentId: string,
    status: AppointmentStatus | any,
    businessId: string
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        // Determine role (simplified for now, can be improved)
        const initiatorRole: "staff" | "patron" | "system" = "staff"

        const result = await AppointmentService.updateAppointmentStatus(
            { appointmentId, status, businessId },
            initiatorRole,
            user?.id
        )

        if (result.success) {
            revalidatePath("/patron/dashboard")
            revalidatePath("/patron/calendar")
            return { success: true, data: undefined }
        }

        return { success: false, error: { message: (result as any).error || "Hata oluştu." } }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Durum güncellenirken bir hata oluştu."
        return { success: false, error: { message } }
    }
}

/**
 * Manuel randevu oluşturur (Patron/Personel panelinden).
 */
export async function createManualAppointmentAction(data: any) {
    try {
        const result = await AppointmentService.createAppointment(data)
        
        if (result.success) {
            revalidatePath("/patron/takvim")
            revalidatePath("/patron/dashboard")
        }
        
        return result
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Randevu eklenirken hata oluştu." }
    }
}

/**
 * Randevuyu iptal eder.
 */
export async function cancelAppointmentAction(
    appointmentId: string,
    businessId: string,
    reason?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Check if initiator is staff
        const { data: isStaff } = await supabase
            .from("staff_business")
            .select("id")
            .eq("business_id", businessId)
            .eq("user_id", user?.id)
            .maybeSingle()

        const result = await AppointmentService.cancelAppointment(
            { appointmentId, businessId, reason },
            isStaff ? "staff" : "customer"
        )

        if (result.success) {
            revalidatePath("/patron/takvim")
            revalidatePath("/patron/dashboard")
        }

        return result
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "İptal işlemi başarısız oldu." }
    }
}

/**
 * Randevu detaylarını getirir.
 */
export async function getAppointmentDetailsAction(appointmentId: string) {
    return await AppointmentService.getDetails(appointmentId)
}

/**
 * Randevuya dahili not ekler.
 */
export async function addAppointmentNoteAction(
    appointmentId: string,
    businessId: string,
    note: string
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Oturum bulunamadı.")

        // İptal edilecek bir şey yok, sadece servis katmanına git
        const result = await AppointmentService.addAppointmentNote({
            appointmentId,
            businessId,
            note,
            userId: user.id
        })

        if (result.success) {
            revalidatePath("/patron/calendar")
            return { success: true, data: undefined }
        }

        return { success: false, error: { message: result.error?.message || "Not eklenemedi." } }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message } }
    }
}

/**
 * Birden fazla randevunun durumunu günceller.
 */
export async function bulkUpdateAppointmentStatusAction(
    appointmentIds: string[],
    status: string,
    businessId: string
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Oturum bulunamadı.")

        // Get user role for cancellation
        const { data: owner } = await supabase.from("business_owners").select("id").eq("user_id", user.id).eq("business_id", businessId).maybeSingle()
        const initiatorRole = owner ? "staff" : "staff" // Simplified for now

        const result = await AppointmentService.bulkUpdateStatus({
            appointmentIds,
            status,
            businessId
        }, initiatorRole)

        if (result.success) {
            revalidatePath("/patron/appointments")
            revalidatePath("/patron/calendar")
            return { success: true, data: undefined }
        }

        return { success: false, error: { message: result.error?.message || "Güncelleme başarısız." } }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message } }
    }
}
