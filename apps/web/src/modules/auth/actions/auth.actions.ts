"use server"

import * as Sentry from "@sentry/nextjs"
import { createCustomerRepositories } from "@randesk/shared"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { ActionResult } from "@/lib/validations/action-types"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin } from "@/lib/permissions"
import { AuthService } from "@/src/modules/auth/services/auth.service"
import { NotificationSettings, QuickRebookData, UserRole } from "../types"
import type { User } from "@supabase/supabase-js"

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CreateUserSchema = z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().optional().or(z.literal("")),
    role: z.enum(["patron", "personel", "musteri", "super_admin", "user"]).default("user"),
    existingBusinessId: z.string().uuid().optional(),
})

export async function createUserAction(formData: FormData): Promise<ActionResult<{ user: User }>> {
    try {
        if (!await isSuperAdmin()) {
            return { success: false, error: { message: "Yetkisiz işlem: Bu alan sadece Super Admin'lere açıktır." } }
        }

        const rawData = {
            name: formData.get("name")?.toString() || "",
            email: formData.get("email")?.toString() || "",
            password: formData.get("password")?.toString() || "",
            phone: formData.get("phone")?.toString() || "",
            role: formData.get("role")?.toString() || "user",
            existingBusinessId: formData.get("existingBusinessId")?.toString(),
        }

        const parsed = CreateUserSchema.safeParse(rawData)
        if (!parsed.success) return { success: false, error: { message: parsed.error.errors[0].message } }

        const { name, email, password, phone, role, existingBusinessId } = parsed.data

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email, password, phone: phone || undefined, email_confirm: true,
            user_metadata: { name }
        })

        if (error || !data?.user) throw error || new Error("User creation failed")

        const userId = data.user.id
        await new Promise(res => setTimeout(res, 300))

        if (role === "super_admin") {
            await supabaseAdmin.from("super_admins").insert({ user_id: userId })
        } else if (role === "patron" && existingBusinessId) {
            await supabaseAdmin.from("business_owners").insert({ user_id: userId, business_id: existingBusinessId })
            await supabaseAdmin.from("staff_business").insert({ 
                user_id: userId, 
                business_id: existingBusinessId,
                can_set_own_price: true,
                can_set_own_duration: true
            })
        }

        await AuthService.updateUserRole(userId, role)

        return { success: true, data: { user: data.user } }
    } catch (error: unknown) {
        Sentry.captureException(error)
        const message = error instanceof Error ? error.message : "Beklenmedik bir hata oluştu."
        return { success: false, error: { message } }
    }
}

export async function updateUserProfileAction(
    name: string, 
    phone: string, 
    notificationSettings: NotificationSettings
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: { message: "Oturum açılmamış." } }

        const repositories = createCustomerRepositories(supabase)
        const result = await repositories.customerProfile.updateProfile(user.id, {
            name,
            phone,
            notification_settings: notificationSettings
        })
        if (result.success) {
            await supabase.auth.updateUser({ data: { name } })
            return { success: true, data: undefined }
        }
        return { success: false, error: { message: result.error.message || "Profil güncellenemedi." } }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Profil güncellenirken hata oluştu."
        return { success: false, error: { message } }
    }
}

export async function getQuickRebookDataAction(): Promise<ActionResult<QuickRebookData[]>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: { message: "Oturum açılmamış." } }

        const data = await AuthService.getQuickRebookData(user.id)
        return { success: true, data }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Tekrar randevu verileri alınamadı."
        return { success: false, error: { message } }
    }
}

export async function deleteUserAction(userId: string): Promise<ActionResult<void>> {
    try {
        if (!await isSuperAdmin()) {
            return { success: false, error: { message: "Yetkisiz işlem: Sadece Super Admin silebilir." } }
        }

        const supabase = await createClient()
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error
        return { success: true }
    } catch (err: unknown) {
        Sentry.captureException(err)
        const message = err instanceof Error ? err.message : "Kullanıcı silinemedi."
        return { success: false, error: { message } }
    }
}

export async function impersonateUserAction(targetUserId: string): Promise<ActionResult<void>> {
    if (!await isSuperAdmin()) {
        return { success: false, error: { message: "Yetkisiz işlem: Sadece Super Admin başka hesaba geçebilir." } }
    }

    const cookieStore = await cookies()
    cookieStore.set("x-impersonate-user-id", targetUserId, { maxAge: 60 * 60 * 2, path: "/" })
    revalidatePath("/")
    return { success: true }
}

export async function stopImpersonatingAction(): Promise<ActionResult<void>> {
    const cookieStore = await cookies()
    cookieStore.delete("x-impersonate-user-id")
    revalidatePath("/")
    return { success: true }
}
