import { SupabaseClient, User } from "@supabase/supabase-js"
import { getDashboardPath, type UserRole } from "@randesk/shared"
import * as Sentry from "@sentry/nextjs"

export type { UserRole }

/**
 * Kullanıcının rolünü belirler.
 * Öncelik sırası: super_admin > patron > personel > musteri
 *
 * Optimizasyon: Role önce Supabase JWT (app_metadata.role) içerisinden okunur.
 * Sadece token içinde rol bilgisi bulunmuyorsa fallback olarak paralel DB sorguları atılır.
 */
export async function getUserRole(
    supabase: SupabaseClient,
    userOrId: User | string
): Promise<UserRole> {
    const user = typeof userOrId === "string" ? null : (userOrId as User)
    const userId = typeof userOrId === "string" ? userOrId : user!.id

    // 0. Nano-saniye JWT okuması (Aktif Optimizasyon!)
    if (user?.app_metadata?.role) {
        return user.app_metadata.role as UserRole
    }

    // 1. Fallback: Hızlı yol, global_role kolonu ile super_admin + profil kontrolü
    const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("global_role")
        .eq("id", userId)
        .maybeSingle()

    if (userErr) {
        Sentry.captureException(userErr, {
            tags: { module: 'auth' },
            extra: { context: 'getUserRole user fetch error' }
        })
    }

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

    if (ownerResult.error) {
        Sentry.captureException(ownerResult.error, {
            tags: { module: 'auth' },
            extra: { context: 'Owner check error' }
        })
    }
    if (staffResult.error) {
        Sentry.captureException(staffResult.error, {
            tags: { module: 'auth' },
            extra: { context: 'Staff check error' }
        })
    }

    if (ownerResult.data) return "patron"
    if (staffResult.data) return "personel"

    return "musteri"
}

export { getDashboardPath }
