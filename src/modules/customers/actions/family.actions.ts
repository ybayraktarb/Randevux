import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"
import type { ActionResult } from "@/lib/validations/action-types"
import type { FamilyProfile } from "@/src/modules/customers/components/dashboard/types"

/**
 * Aile profili ekler
 */
export async function addFamilyProfileAction(data: {
    fullName: string
    relationship: string
    birthDate?: string
    gender?: 'male' | 'female' | 'other'
}): Promise<ActionResult> {
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
        return { success: true, data: undefined }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Profil eklenirken hata oluştu."
        return { success: false, error: { message } }
    }
}

/**
 * Aile profilini siler
 */
export async function deleteFamilyProfileAction(id: string): Promise<ActionResult> {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from("family_profiles")
            .delete()
            .eq("id", id)

        if (error) throw error

        revalidatePath("/musteri/dashboard")
        return { success: true, data: undefined }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Profil silinirken hata oluştu."
        return { success: false, error: { message } }
    }
}

/**
 * Kullanıcının aile profillerini getirir
 */
export async function getFamilyProfilesAction(): Promise<ActionResult<FamilyProfile[]>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: { message: "Oturum yok" } }

        const { data, error } = await supabase
            .from("family_profiles")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })

        if (error) throw error

        return { success: true, data: (data || []) as FamilyProfile[] }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Profiller yüklenirken hata oluştu."
        return { success: false, error: { message } }
    }
}
