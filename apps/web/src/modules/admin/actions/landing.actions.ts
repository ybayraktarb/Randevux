"use server"

import { createClient } from "@/lib/supabase/server"
import { isSuperAdmin } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import type { LandingPageProps, LandingSettings, PackageProps } from "@/src/modules/landing/lib/types"

// ─── GET: Landing Settings ──────────────────────────────────────────────────

export async function getLandingSettingsAction(): Promise<{
    success: boolean
    data?: LandingSettings
    error?: string
}> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("landing_settings")
            .select("*")
            .eq("id", 1)
            .single()

        if (error) throw error
        return { success: true, data: data as LandingSettings }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─── GET: Landing Packages (active, with features) ──────────────────────────

export async function getLandingPackagesAction(): Promise<{
    success: boolean
    data?: PackageProps[]
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: pkgs, error: pkgErr } = await supabase
            .from("packages")
            .select(`
                id,
                name,
                description,
                price_monthly,
                price_yearly,
                is_featured,
                image_url,
                sort_order,
                package_features (
                    features ( display_name )
                )
            `)
            .eq("is_active", true)
            .order("sort_order", { ascending: true })

        if (pkgErr) throw pkgErr

        const mapped: PackageProps[] = (pkgs || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            price_monthly: p.price_monthly || 0,
            price_yearly: p.price_yearly || 0,
            is_featured: p.is_featured || false,
            image_url: p.image_url || undefined,
            features: (p.package_features || [])
                .map((pf: any) =>
                    pf.features && typeof pf.features === "object"
                        ? (pf.features as { display_name: string }).display_name
                        : null
                )
                .filter(Boolean) as string[],
        }))

        return { success: true, data: mapped }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─── UPDATE: Landing Settings ───────────────────────────────────────────────

export async function updateLandingSettingsAction(
    data: LandingPageProps
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!(await isSuperAdmin())) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const dbData = {
            // Hero
            hero_title: data.hero.title,
            hero_subtitle: data.hero.subtitle,
            hero_image_url: data.hero.imageUrl || null,
            hero_cta_text: data.hero.ctaText,
            // Features (pazarlama kartları)
            features_json: data.features,
            // About
            about_title: data.about.title,
            about_subtitle: data.about.subtitle,
            about_vision_title: data.about.vision.title,
            about_vision_description: data.about.vision.description,
            about_mission_title: data.about.mission.title,
            about_mission_description: data.about.mission.description,
            about_story: data.about.story,
            about_image_url: data.about.imageUrl || null,
            // Contact
            contact_title: data.contact.title,
            contact_subtitle: data.contact.subtitle,
            contact_email: data.contact.info.email || null,
            contact_phone: data.contact.info.phone || null,
            contact_address: data.contact.info.address || null,
            contact_form_labels: data.contact.formLabels,
        }

        const { error } = await supabase
            .from("landing_settings")
            .update(dbData)
            .eq("id", 1)

        if (error) throw error

        // Landing page'i revalidate et
        revalidatePath("/")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}
