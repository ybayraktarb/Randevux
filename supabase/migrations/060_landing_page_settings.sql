-- Create landing_settings table (singleton)
CREATE TABLE IF NOT EXISTS public.landing_settings (
  id integer PRIMARY KEY DEFAULT 1,
  
  -- Hero Section
  hero_title text DEFAULT 'Randevularınızı Kolaylaştırın, İşinizi Büyütün',
  hero_subtitle text DEFAULT 'Modern randevu yönetim platformumuzla zamandan tasarruf edin, müşterilerinizle etkileşimi artırın.',
  hero_image_url text,
  
  -- About Section
  about_content text DEFAULT 'Siz işinize odaklanın, randevularınızı biz yönetelim. Profesyonel ekibimiz ve gelişmiş altyapımızla işletmenizin yanındayız.',
  about_image_url text,
  
  -- Contact Section
  contact_email text,
  contact_phone text,
  contact_address text,
  social_links jsonb DEFAULT '{"instagram": "", "linkedin": "", "twitter": ""}'::jsonb,
  
  -- Features
  features_json jsonb DEFAULT '[
    {"title": "Akıllı Takvim", "description": "Tüm randevularınızı tek bir ekranda görün ve yönetin.", "icon": "calendar"},
    {"title": "Müşteri Yönetimi", "description": "Müşteri geçmişi, tercihleri ve detaylı raporlamalar elinizin altında.", "icon": "users"},
    {"title": "Otomatik Hatırlatmalar", "description": "Randevu unutulmalarını önlemek için SMS ve e-posta bildirimleri.", "icon": "bell"}
  ]'::jsonb,
  
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- RLS
ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read
DROP POLICY IF EXISTS "landing_settings_read_all" ON public.landing_settings;
CREATE POLICY "landing_settings_read_all" ON public.landing_settings FOR SELECT USING (true);

-- Only super admins can manage
DROP POLICY IF EXISTS "landing_settings_manage_superadmin" ON public.landing_settings;
CREATE POLICY "landing_settings_manage_superadmin" ON public.landing_settings 
  FOR ALL USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

-- Insert initial row if empty
INSERT INTO public.landing_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_landing_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_landing_settings_updated_at ON public.landing_settings;
CREATE TRIGGER trg_landing_settings_updated_at
BEFORE UPDATE ON public.landing_settings
FOR EACH ROW
EXECUTE FUNCTION update_landing_settings_updated_at();
