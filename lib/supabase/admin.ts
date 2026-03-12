import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Supabase Admin Client — service_role key kullanır.
 * Sadece server-side (Server Actions, Route Handlers) kullanılmalı.
 * inviteUserByEmail, admin.deleteUser gibi privileged işlemler için gerekli.
 */
export async function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY env değişkeni eksik. " +
            ".env.local dosyasını kontrol edin."
        )
    }

    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
