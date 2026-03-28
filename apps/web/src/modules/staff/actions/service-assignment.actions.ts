"use server"

import * as Sentry from "@sentry/nextjs"
import { createAdminClient } from "@/lib/supabase/admin"

import { revalidatePath } from "next/cache"

/**
 * Personeli bir hizmete atar.
 */
export async function assignStaffServiceAction(staffBusinessId: string, serviceId: string, customPrice?: number, customDuration?: number) {
    try {
        if (!staffBusinessId || !serviceId) {
            return { success: false, error: { message: "Gerekli parametreler eksik." } };
        }

        const supabaseAdmin = await createAdminClient()

        const { error } = await supabaseAdmin
            .from("staff_services")
            .insert({
                staff_business_id: staffBusinessId,
                service_id: serviceId,
                custom_price: customPrice,
                custom_duration_minutes: customDuration,
                is_active: true
            });

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: { message: "Bu hizmet zaten personele atanmış." } };
            }
            Sentry.captureException(error, { tags: { module: 'staff', action: 'assignStaffServiceAction' } });
            return { success: false, error: { message: "Hizmet atanırken bir hata oluştu." } };
        }

        revalidatePath("/(patron)/[business_id]/staff/[staff_id]", "page");

        return { success: true };
    } catch (error) {
        Sentry.captureException(error);
        return { success: false, error: { message: "Beklenmedik bir hata oluştu." } };
    }
}

/**
 * Personelin hizmet atamasını kaldırır.
 */
export async function removeStaffServiceAction(staffBusinessId: string, serviceId: string) {
    try {
        if (!staffBusinessId || !serviceId) {
            return { success: false, error: { message: "Gerekli parametreler eksik." } };
        }

        const supabaseAdmin = await createAdminClient()

        const { error } = await supabaseAdmin
            .from("staff_services")
            .delete()
            .match({
                staff_business_id: staffBusinessId,
                service_id: serviceId,
            });

        if (error) {
            Sentry.captureException(error, { tags: { module: 'staff', action: 'removeStaffServiceAction' } });
            return { success: false, error: { message: "Hizmet silinirken bir hata oluştu." } };
        }

        revalidatePath("/(patron)/[business_id]/staff/[staff_id]", "page");

        return { success: true };
    } catch (error) {
        Sentry.captureException(error);
        return { success: false, error: { message: "Beklenmedik bir hata oluştu." } };
    }
}

/**
 * Personelin atanmış hizmetinin detaylarını günceller (fiyat/süre).
 */
export async function updateStaffServiceAction(staffBusinessId: string, serviceId: string, customPrice?: number | null, customDuration?: number | null, isActive?: boolean) {
    try {
        if (!staffBusinessId || !serviceId) {
            return { success: false, error: { message: "Gerekli parametreler eksik." } };
        }

        const updateData: any = {};
        if (customPrice !== undefined) updateData.custom_price = customPrice;
        if (customDuration !== undefined) updateData.custom_duration_minutes = customDuration;
        if (isActive !== undefined) updateData.is_active = isActive;

        const supabaseAdmin = await createAdminClient()

        const { error } = await supabaseAdmin
            .from("staff_services")
            .update(updateData)
            .match({
                staff_business_id: staffBusinessId,
                service_id: serviceId,
            });

        if (error) {
            Sentry.captureException(error, { tags: { module: 'staff', action: 'updateStaffServiceAction' } });
            return { success: false, error: { message: "Hizmet güncellenirken bir hata oluştu." } };
        }

        revalidatePath("/(patron)/[business_id]/staff/[staff_id]", "page");

        return { success: true };
    } catch (error) {
        Sentry.captureException(error);
        return { success: false, error: { message: "Beklenmedik bir hata oluştu." } };
    }
}
