"use server"

import * as Sentry from "@sentry/nextjs"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// types
export type WorkSchedule = {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_working: boolean;
}

export type BreakSchedule = {
    day_of_week: number;
    start_time: string;
    end_time: string;
    label: string;
}

/**
 * Personelin haftalık çalışma saatlerini günceller.
 */
export async function updateStaffWorkSchedulesAction(staffBusinessId: string, schedules: WorkSchedule[]) {
    try {
        if (!staffBusinessId || !schedules) {
            return { success: false, error: { message: "Gerekli parametreler eksik." } };
        }

        // Önce mevcutları sil
        const { error: deleteError } = await supabaseAdmin
            .from("work_schedule_templates")
            .delete()
            .eq("staff_business_id", staffBusinessId);

        if (deleteError) {
            console.error("Çalışma saatleri silinirken hata:", deleteError);
            return { success: false, error: { message: "Çalışma saatleri silinirken bir hata oluştu." } };
        }

        // Yenileri ekle
        if (schedules.length > 0) {
            const insertData = schedules.map(s => ({
                staff_business_id: staffBusinessId,
                day_of_week: s.day_of_week,
                start_time: s.start_time,
                end_time: s.end_time,
                is_working: s.is_working
            }));

            const { error: insertError } = await supabaseAdmin
                .from("work_schedule_templates")
                .insert(insertData);

            if (insertError) {
                console.error("Çalışma saatleri eklenirken hata:", insertError);
                return { success: false, error: { message: "Çalışma saatleri kaydedilirken hata oluştu." } };
            }
        }

        revalidatePath("/(patron)/[business_id]/staff/[staff_id]", "page");

        return { success: true };
    } catch (error) {
        Sentry.captureException(error);
        return { success: false, error: { message: "Beklenmedik bir hata oluştu." } };
    }
}

/**
 * Personelin mola saatlerini (Break Blocks) günceller.
 */
export async function updateStaffBreaksAction(staffBusinessId: string, breaks: BreakSchedule[]) {
    try {
        if (!staffBusinessId || !breaks) {
            return { success: false, error: { message: "Gerekli parametreler eksik." } };
        }

        // Önce mevcutları sil
        const { error: deleteError } = await supabaseAdmin
            .from("break_schedules")
            .delete()
            .eq("staff_business_id", staffBusinessId);

        if (deleteError) {
            console.error("Mola saatleri silinirken hata:", deleteError);
            return { success: false, error: { message: "Mola saatleri silinirken bir hata oluştu." } };
        }

        // Yenileri ekle
        if (breaks.length > 0) {
            const insertData = breaks.map(b => ({
                staff_business_id: staffBusinessId,
                day_of_week: b.day_of_week,
                start_time: b.start_time,
                end_time: b.end_time,
                label: b.label || 'Mola'
            }));

            const { error: insertError } = await supabaseAdmin
                .from("break_schedules")
                .insert(insertData);

            if (insertError) {
                console.error("Mola saatleri eklenirken hata:", insertError);
                return { success: false, error: { message: "Mola saatleri kaydedilirken hata oluştu." } };
            }
        }

        revalidatePath("/(patron)/[business_id]/staff/[staff_id]", "page");

        return { success: true };
    } catch (error) {
        Sentry.captureException(error);
        return { success: false, error: { message: "Beklenmedik bir hata oluştu." } };
    }
}
