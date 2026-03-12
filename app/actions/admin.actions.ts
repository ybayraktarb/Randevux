"use server"

import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

/**
 * Bir işletmenin tüm özelliklerini ve kaynaklarını (source) getirir.
 */
export async function getBusinessFeaturesAction(businessId: string) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { data: allFeatures, error: featError } = await supabase
            .from("features")
            .select("*")

        if (featError) throw featError

        const { data: businessFeatures, error: bizFeatError } = await supabase
            .from("business_features")
            .select("*")
            .eq("business_id", businessId)

        if (bizFeatError) throw bizFeatError

        const result = allFeatures.map((f: any) => {
            const bizFeature = (businessFeatures || []).find((bf: any) => bf.feature_id === f.id)
            return {
                id: f.id,
                key: f.key,
                name: f.display_name,
                description: f.description,
                isEnabled: bizFeature ? bizFeature.is_enabled : false,
                source: bizFeature ? (bizFeature.source || "manual") : null,
                validUntil: bizFeature ? bizFeature.valid_until : null,
                bizFeatureId: bizFeature ? bizFeature.id : null,
            }
        })

        return { success: true, data: result }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * Manuel olarak bir özelliği işletmeye atar (source: 'manual').
 */
export async function addManualFeatureAction(businessId: string, featureId: string) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { error } = await supabase
            .from("business_features")
            .upsert(
                { business_id: businessId, feature_id: featureId, is_enabled: true, source: "manual" },
                { onConflict: "business_id,feature_id" }
            )

        if (error) throw error
        revalidatePath("/admin-dashboard")
        revalidatePath("/", "layout")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * İşletme özelliğini aktif/pasif yapar. (source değişmez)
 */
export async function toggleBusinessFeatureAction(businessId: string, featureId: string, isEnabled: boolean) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { data: existing } = await supabase
            .from("business_features")
            .select("id, source")
            .eq("business_id", businessId)
            .eq("feature_id", featureId)
            .maybeSingle()

        if (existing) {
            const { error } = await supabase
                .from("business_features")
                .update({ is_enabled: isEnabled })
                .eq("id", existing.id)
            if (error) throw error
        } else {
            // Yeni kayıt: source = manual (Super Admin tarafından eklendi)
            const { error } = await supabase
                .from("business_features")
                .insert({ business_id: businessId, feature_id: featureId, is_enabled: isEnabled, source: "manual" })
            if (error) throw error
        }

        revalidatePath("/admin-dashboard")
        revalidatePath("/", "layout")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * İşletmenin paketini ve özel fiyatını günceller.
 */
export async function updateBusinessPackageAction(businessId: string, packageId: string | null, customPrice?: number) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { error } = await supabase
            .from("businesses")
            .update({
                package_id: packageId,
                custom_price: customPrice
            })
            .eq("id", businessId)

        if (error) throw error

        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * İşletmenin markalama (white-label) ayarlarını günceller.
 */
export async function updateBusinessBrandingAction(businessId: string, brandingConfig: any) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { error } = await supabase
            .from("businesses")
            .update({ branding_config: brandingConfig })
            .eq("id", businessId)

        if (error) throw error

        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * İşletmenin abonelik sözleşme bilgilerini günceller (Bitiş tarihi, URL vb.)
 */
export async function updateBusinessContractAction(businessId: string, payload: { ends_at?: string | null, contract_url?: string | null }) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { error } = await supabase
            .from("subscriptions")
            .update(payload)
            .eq("business_id", businessId)

        if (error) throw error

        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

