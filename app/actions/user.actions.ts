"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Projede bu key .env dosyasında tanımlanmalı
)

export async function createUserAction(formData: FormData) {
    const name = formData.get("name")?.toString()
    const email = formData.get("email")?.toString()
    const password = formData.get("password")?.toString()

    if (!name || !email || !password) {
        return { error: "Lütfen ad, e-posta ve şifre alanlarını doldurun." }
    }

    // Supabase Admin API ile kullanıcı oluştur
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // E-posta doğrulamasını atla (Admin oluşturduğu için)
        user_metadata: {
            name: name,
        }
    })

    // Auth tarafında oluşursa Public.users tablosuna Trigger ile düşüp düşmediği
    // veri tabanındaki handle_new_user trigger'ımız tarafından sağlanır.
    // Ekstra bir işlem yapmamıza gerek yok.

    if (error) {
        return { error: error.message }
    }

    return { success: true, user: data.user }
}
