"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServerClient } from "@supabase/supabase-js"

/**
 * Müşterinin VIP durumunu değiştirir
 */
export async function toggleVipStatusAction(
    businessId: string,
    customerUserId: string,
    isVip: boolean
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("business_customers")
        .update({ is_vip: isVip })
        .eq("business_id", businessId)
        .eq("user_id", customerUserId)

    if (error) {
        return { success: false, error: { message: error.message } }
    }

    return { success: true }
}

/**
 * İşletmeye özel müşteri notlarını günceller
 */
export async function updateCustomerInternalNotesAction(
    businessId: string,
    customerUserId: string,
    notes: string
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("business_customers")
        .update({ internal_notes: notes })
        .eq("business_id", businessId)
        .eq("user_id", customerUserId)

    if (error) {
        return { success: false, error: { message: error.message } }
    }

    return { success: true }
}

/**
 * Manuel müşteri ekleme
 * Eğer sistemde (users) e-posta ile kayıtlıysa onu işletmeye bağlar.
 * Kayıtlı değilse, patronsun girdiği isim ve telefonla ona bir "gölge (shadow)" profil oluşturur.
 */
export async function addCustomerToBusinessAction(
    businessId: string,
    email: string,
    name: string,
    phone: string
) {
    const supabase = await createClient()

    // 1. Kullanıcıyı e-posta ile bul
    let targetUserId = ""
    let targetUserName = name || ""

    // Use regular client for fetching business context
    const { data: existingUser } = await supabase
        .from("users")
        .select("id, name")
        .eq("email", email)
        .maybeSingle()

    if (existingUser) {
        targetUserId = existingUser.id
        targetUserName = existingUser.name || name
    } else {
        // Eğer yoksa "shadow" user oluşturalım via Admin API
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: "Randevuxx" + Math.random().toString(36).slice(2) + "!",
            phone: phone || undefined,
            email_confirm: true,
            user_metadata: {
                name: targetUserName,
            }
        })

        if (createError || !newUser?.user) return { success: false, error: { message: "Yeni müşteri profili oluşturulamadı: " + createError?.message } }
        targetUserId = newUser.user.id

        // Wait for Postgres trigger to populate public.users
        await new Promise(res => setTimeout(res, 400))
    }

    // 2. İşletmeye bağla
    const { error: linkError } = await supabase
        .from("business_customers")
        .insert({
            business_id: businessId,
            user_id: targetUserId
        })

    if (linkError) {
        if (linkError.code === "23505") {
            return { success: false, error: { message: "Bu müşteri zaten işletmenize kayıtlı." } }
        }
        return { success: false, error: { message: linkError.message } }
    }

    return { success: true, data: { id: targetUserId, name: targetUserName } }
}

/**
 * Müşterinin bir işletmeden ayrılmasını sağlar
 */
export async function leaveBusinessAction(businessId: string): Promise<{ success: boolean; error?: { message: string } }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: { message: "Oturum açılmamış." } }
    }

    const { error } = await supabase
        .from("business_customers")
        .delete()
        .eq("business_id", businessId)
        .eq("user_id", user.id)

    if (error) {
        console.error("Leave business error:", error)
        return { success: false, error: { message: error.message } }
    }

    return { success: true }
}
