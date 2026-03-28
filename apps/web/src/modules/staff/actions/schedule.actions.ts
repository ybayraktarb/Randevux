"use server"

import * as Sentry from "@sentry/nextjs"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

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

        const supabaseAdmin = await createAdminClient()

        // Önce mevcutları sil
        const { error: deleteError } = await supabaseAdmin
            .from("work_schedule_templates")
            .delete()
            .eq("staff_business_id", staffBusinessId);

        if (deleteError) {
            Sentry.captureException(deleteError, { tags: { module: 'staff', action: 'updateStaffWorkSchedulesAction.delete' } });
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
                Sentry.captureException(insertError, { tags: { module: 'staff', action: 'updateStaffWorkSchedulesAction.insert' } });
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

        const supabaseAdmin = await createAdminClient()

        // Önce mevcutları sil
        const { error: deleteError } = await supabaseAdmin
            .from("break_schedules")
            .delete()
            .eq("staff_business_id", staffBusinessId);

        if (deleteError) {
            Sentry.captureException(deleteError, { tags: { module: 'staff', action: 'updateStaffBreaksAction.delete' } });
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
                Sentry.captureException(insertError, { tags: { module: 'staff', action: 'updateStaffBreaksAction.insert' } });
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
