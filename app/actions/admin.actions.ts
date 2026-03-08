"use server"

import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

/**
 * Bir işletmenin tüm özelliklerini ve durumlarını getirir.
 */
export async function getBusinessFeaturesAction(businessId: string) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        // Önce tüm aktif sistem özelliklerini al
        const { data: allFeatures, error: featError } = await supabase
            .from("features")
            .select("*")
            .eq("is_active", true)

        if (featError) throw featError

        // Sonra işletmeye tanımlı olanları al
        const { data: businessFeatures, error: bizFeatError } = await supabase
            .from("business_features")
            .select("*")
            .eq("business_id", businessId)

        if (bizFeatError) throw bizFeatError

        // Verileri birleştir
        const result = allFeatures.map(f => {
            const bizFeature = (businessFeatures || []).find(bf => bf.feature_id === f.id)
            return {
                id: f.id,
                key: f.key,
                name: f.display_name,
                description: f.description,
                isEnabled: bizFeature ? bizFeature.is_enabled : false,
                validUntil: bizFeature ? bizFeature.valid_until : null,
                bizFeatureId: bizFeature ? bizFeature.id : null
            }
        })

        return { success: true, data: result }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * İşletme özelliğini aktif/pasif yapar veya yeni özellik tanımlar.
 */
export async function toggleBusinessFeatureAction(businessId: string, featureId: string, isEnabled: boolean) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        // Önce kayıt var mı diye bak
        const { data: existing } = await supabase
            .from("business_features")
            .select("id")
            .eq("business_id", businessId)
            .eq("feature_id", featureId)
            .single()

        if (existing) {
            const { error } = await supabase
                .from("business_features")
                .update({ is_enabled: isEnabled })
                .eq("id", existing.id)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from("business_features")
                .insert({
                    business_id: businessId,
                    feature_id: featureId,
                    is_enabled: isEnabled
                })
            if (error) throw error
        }

        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}
