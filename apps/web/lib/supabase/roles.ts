import { SupabaseClient } from "@supabase/supabase-js"
import { getDashboardPath, type UserRole } from "@randevux/shared"

export type { UserRole }

/**
 * Kullanıcının rolünü belirler.
 * Öncelik sırası: super_admin > patron > personel > musteri
 *
 * Optimizasyon: Super admin kontrolü önce users.global_role kolonuna bakarak
 * tek sorguda yapılır (migration 036). Patron/personel tespiti için 2 paralel sorgu.
 */
export async function getUserRole(
    supabase: SupabaseClient,
    userId: string
): Promise<UserRole> {
    // 1. Hızlı yol: global_role kolonu ile super_admin + profil kontrolü
    const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("global_role")
        .eq("id", userId)
        .maybeSingle()

    if (userErr) console.error("getUserRole user fetch error:", userErr.message)

    if (userRow?.global_role === "super_admin") return "super_admin"

    // 2. Patron ve personel kontrolü — paralel
    const [ownerResult, staffResult] = await Promise.all([
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

    if (ownerResult.error) console.error("Owner check error:", ownerResult.error.message)
    if (staffResult.error) console.error("Staff check error:", staffResult.error.message)

    if (ownerResult.data) return "patron"
    if (staffResult.data) return "personel"

    return "musteri"
}

export { getDashboardPath }
