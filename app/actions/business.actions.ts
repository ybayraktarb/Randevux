"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

/**
 * İşletmeyi favorilere ekler veya çıkarır
 */
export async function toggleFavoriteAction(businessId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        const { data: existing } = await supabase
            .from("user_favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("business_id", businessId)
            .maybeSingle()

        if (existing) {
            const { error } = await supabase
                .from("user_favorites")
                .delete()
                .eq("id", existing.id)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from("user_favorites")
                .insert({
                    user_id: user.id,
                    business_id: businessId
                })
            if (error) throw error
        }

        revalidatePath("/musteri/dashboard")
        revalidatePath(`/isletme/${businessId}`)

        return { success: true, isFavorite: !existing }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "İşlem başarısız oldu." }
    }
}

/**
 * İşletme için değerlendirme/yorum ekler
 */
export async function addReviewAction(
    businessId: string,
    rating: number,
    comment: string,
    appointmentId?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        const { error } = await supabase
            .from("business_reviews")
            .insert({
                business_id: businessId,
                user_id: user.id,
                appointment_id: appointmentId,
                rating,
                comment
            })

        if (error) throw error

        revalidatePath(`/isletme/${businessId}`)

        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Yorum eklenirken bir hata oluştu." }
    }
}
