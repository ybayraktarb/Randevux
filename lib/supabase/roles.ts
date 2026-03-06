import { SupabaseClient } from "@supabase/supabase-js"

export type UserRole = "super_admin" | "patron" | "personel" | "musteri"

/**
 * Kullanıcının rolünü belirler ve doğru dashboard'a yönlendirir.
 * Öncelik sırası: super_admin > patron > personel > musteri
 * 3 sorgu paralel çalışır (Promise.all).
 */
export async function getUserRole(
    supabase: SupabaseClient,
    userId: string
): Promise<UserRole> {
    // 3 sorguyu paralel çalıştır
    const [superAdminResult, ownerResult, staffResult] = await Promise.all([
        supabase
            .from("super_admins")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle(),
        supabase
            .from("business_owners")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle(),
        supabase
            .from("staff_business")
            .select("id")
            .eq("user_id", userId)
            .eq("is_active", true)
            .maybeSingle(),
    ])

    // Öncelik sırasıyla kontrol et
    if (superAdminResult.data) return "super_admin"
    if (ownerResult.data) return "patron"
    if (staffResult.data) return "personel"

    // Default: müşteri
    return "musteri"
}

/**
 * Role göre doğru dashboard yolunu döner.
 */
export function getDashboardPath(role: UserRole): string {
    const paths: Record<UserRole, string> = {
        super_admin: "/admin-dashboard",
        patron: "/patron-dashboard",
        personel: "/personel-panel",
        musteri: "/musteri-panel",
    }
    return paths[role]
}
