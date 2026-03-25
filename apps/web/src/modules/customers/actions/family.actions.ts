"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as Sentry from "@sentry/nextjs"
import { createCustomerRepositories, type AddFamilyProfileInput } from "@randevux/shared"
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

        const repositories = createCustomerRepositories(supabase)
        const result = await repositories.familyProfiles.add(user.id, data as AddFamilyProfileInput)
        if (!result.success) throw new Error(result.error.message)

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
        const repositories = createCustomerRepositories(supabase)
        const result = await repositories.familyProfiles.remove(id)
        if (!result.success) throw new Error(result.error.message)

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

        const repositories = createCustomerRepositories(supabase)
        const result = await repositories.familyProfiles.list(user.id)
        if (!result.success) throw new Error(result.error.message)

        return { success: true, data: result.data as FamilyProfile[] }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Profiller yüklenirken hata oluştu."
        return { success: false, error: { message } }
    }
}
