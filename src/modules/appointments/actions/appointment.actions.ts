"use server"

import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { AppointmentService } from "../services/appointment.service"
import type { AppointmentStatus } from "@/shared/types/appointment.types"

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
