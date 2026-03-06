"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"
import { revalidatePath } from "next/cache"

export async function updateAppointmentTimeAction(data: {
    appointmentId: string
    businessId: string
    newStaffBusinessId: string
    newStartTime: string
    newEndTime: string
    date: string // needed for checking conflicts on that day
}) {
    try {
        const supabase = await createClient()

        // 1. Check if the new time slot conflicts with another appointment for the same staff
        const { data: overlapping, error: overlapErr } = await supabase
            .from("appointments")
            .select("id")
            .eq("business_id", data.businessId)
            .eq("staff_business_id", data.newStaffBusinessId)
            .eq("appointment_date", data.date)
            .neq("id", data.appointmentId) // exclude self
            .not("status", "in", '("İptal", "Gelmedi")')
            // Time overlap logic: (NewStart < ExistingEnd) AND (NewEnd > ExistingStart)
            .lt("start_time", data.newEndTime)
            .gt("end_time", data.newStartTime)

        if (overlapErr) throw overlapErr

        if (overlapping && overlapping.length > 0) {
            return {
                success: false,
                error: "Seçilen personelin o saatte başka bir randevusu var."
            }
        }

        // 2. Perform the update
        const { error: updateErr } = await supabase
            .from("appointments")
            .update({
                staff_business_id: data.newStaffBusinessId,
                start_time: data.newStartTime,
                end_time: data.newEndTime
            })
            .eq("id", data.appointmentId)
            .eq("business_id", data.businessId)

        if (updateErr) throw updateErr

        revalidatePath("/patron/takvim")
        return { success: true }
    } catch (err: any) {
        console.error("Drag-Drop Update Error:", err)
        Sentry.captureException(err)
        return { success: false, error: err.message || "Saat güncellenirken hata oluştu." }
    }
}
