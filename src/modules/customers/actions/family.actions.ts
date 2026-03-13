"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"

/**
 * Aile profili ekler
 */
export async function addFamilyProfileAction(data: {
    fullName: string
    relationship: string
    birthDate?: string
    gender?: 'male' | 'female' | 'other'
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        const { error } = await supabase
            .from("family_profiles")
            .insert({
                user_id: user.id,
                full_name: data.fullName,
                relationship: data.relationship,
                birth_date: data.birthDate,
                gender: data.gender
            })

        if (error) throw error

        revalidatePath("/musteri/dashboard")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Profil eklenirken hata oluştu." }
    }
}

/**
 * Aile profilini siler
 */
export async function deleteFamilyProfileAction(id: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("family_profiles")
            .delete()
            .eq("id", id)

        if (error) throw error

        revalidatePath("/musteri/dashboard")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Profil silinirken hata oluştu." }
    }
}

/**
 * Kullanıcının aile profillerini getirir
 */
export async function getFamilyProfilesAction() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: "Oturum yok" }

        const { data, error } = await supabase
            .from("family_profiles")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })

        if (error) throw error

        return { success: true, data }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}
