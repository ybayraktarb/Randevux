export interface HeroProps {
  title: string
  subtitle: string
  imageUrl: string
  ctaText: string
}

export interface FeatureProps {
  icon: string
  title: string
  description: string
}

/** DB'deki packages tablosundan gelen yapı */
export interface PackageProps {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  is_featured: boolean
  image_url?: string
  /** package_features join'inden gelen feature display_name'leri */
  features: string[]
}

export interface AboutProps {
  title: string
  subtitle: string
  vision: {
    title: string
    description: string
  }
  mission: {
    title: string
    description: string
  }
  story: string
  imageUrl: string
}

export interface ContactInfo {
  email: string
  phone: string
  address: string
}

export interface ContactProps {
  title: string
  subtitle: string
  info: ContactInfo
  formLabels: {
    name: string
    email: string
    subject: string
    message: string
    submit: string
  }
}

export interface LandingPageProps {
  hero: HeroProps
  features: FeatureProps[]
  packages: PackageProps[]
  about: AboutProps
  contact: ContactProps
}

/** landing_settings DB satırının tam tipi (admin actions için) */
export interface LandingSettings {
  id: number
  hero_title: string
  hero_subtitle: string
  hero_image_url: string | null
  hero_cta_text: string
  about_title: string
  about_subtitle: string
  about_vision_title: string
  about_vision_description: string
  about_mission_title: string
  about_mission_description: string
  about_story: string
  about_image_url: string | null
  contact_title: string
  contact_subtitle: string
  contact_email: string | null
  contact_phone: string | null
  contact_address: string | null
  contact_form_labels: {
    name: string
    email: string
    subject: string
    message: string
    submit: string
  }
  features_json: FeatureProps[]
  pricing_title: string
  pricing_subtitle: string
  social_links: {
    instagram: string
    linkedin: string
    twitter: string
  }
  updated_at: string
}

