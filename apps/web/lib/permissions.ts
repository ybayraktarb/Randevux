import { createClient } from "@/lib/supabase/server"

/**
 * Bir işletmenin belirli bir özelliğe (feature) erişimi olup olmadığını kontrol eder.
 * @param businessId İşletme ID
 * @param featureKey Özellik anahtarı (örn: 'ai_assistant')
 */
export async function checkFeatureAccess(businessId: string, featureKey: string): Promise<boolean> {
    try {
        const supabase = await createClient()

        // Önce Super Admin mi diye bak? (Super Admin her şeye erişebilir)
        const isSA = await isSuperAdmin()
        if (isSA) return true

        const { data, error } = await supabase
            .rpc('check_feature_access', {
                p_business_id: businessId,
                p_feature_key: featureKey
            })

        if (error) {
            console.error("checkFeatureAccess Error:", error)
            return false
        }

        return !!data
    } catch (err) {
        console.error("checkFeatureAccess Runtime Error:", err)
        return false
    }
}

/**
 * Mevcut kullanıcının Super Admin olup olmadığını kontrol eder.
 */
export async function isSuperAdmin(): Promise<boolean> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return false

        const { data, error } = await supabase
            .from("super_admins")
            .select("id")
            .eq("user_id", user.id)
            .single()

        if (error || !data) return false

        return true
    } catch (err) {
        return false
    }
}
