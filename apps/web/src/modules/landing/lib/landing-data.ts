import { createClient } from "@/lib/supabase/server"
import type { LandingPageProps, FeatureProps, PackageProps } from "./types"
import { landingPageFallback } from "./landing-constants"

// ─── Supabase verisini LandingPageProps'a dönüştür ──────────────────────────
function mapToLandingProps(settings: any, packages: any[]): LandingPageProps {
  const f = landingPageFallback

  return {
    hero: {
      title: settings?.hero_title || f.hero.title,
      subtitle: settings?.hero_subtitle || f.hero.subtitle,
      imageUrl: settings?.hero_image_url || f.hero.imageUrl,
      ctaText: settings?.hero_cta_text || f.hero.ctaText,
    },
    features: (settings?.features_json as FeatureProps[] | null) || f.features,
    packages: (packages || []).map(
      (p: any): PackageProps => ({
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
      })
    ),
    about: {
      title: settings?.about_title || f.about.title,
      subtitle: settings?.about_subtitle || f.about.subtitle,
      vision: {
        title: settings?.about_vision_title || f.about.vision.title,
        description: settings?.about_vision_description || f.about.vision.description,
      },
      mission: {
        title: settings?.about_mission_title || f.about.mission.title,
        description: settings?.about_mission_description || f.about.mission.description,
      },
      story: settings?.about_story || f.about.story,
      imageUrl: settings?.about_image_url || f.about.imageUrl,
    },
    contact: {
      title: settings?.contact_title || f.contact.title,
      subtitle: settings?.contact_subtitle || f.contact.subtitle,
      info: {
        email: settings?.contact_email || f.contact.info.email,
        phone: settings?.contact_phone || f.contact.info.phone,
        address: settings?.contact_address || f.contact.info.address,
      },
      formLabels: settings?.contact_form_labels || f.contact.formLabels,
    },
  }
}

// ─── Ana Fonksiyon (Server Component'ten çağrılır) ──────────────────────────
export async function getLandingPageData(): Promise<LandingPageProps> {
  try {
    const supabase = await createClient()

    const [settingsRes, packagesRes] = await Promise.all([
      supabase.from("landing_settings").select("*").eq("id", 1).single(),
      supabase
        .from("packages")
        .select(
          `
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
        `
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ])

    return mapToLandingProps(settingsRes.data, packagesRes.data || [])
  } catch (err) {
    console.error("[getLandingPageData] Supabase erişimi başarısız, fallback kullanılıyor:", err)
    return landingPageFallback
  }
}
