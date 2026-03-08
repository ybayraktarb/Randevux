-- ============================================================
-- Phase 5 - Monetization & Admin Control (Feature Flags)
-- ============================================================

-- 1. Özellikler (Features) Tanım Tablosu
CREATE TABLE public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- 'ai_assistant', 'advanced_analytics'
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. İşletme Bazlı Özellik Yetkilendirme (Business Features)
CREATE TABLE public.business_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  valid_until TIMESTAMPTZ, -- Süreli üyelik/paket için
  settings JSONB DEFAULT '{}', -- Özelliğe özel konfigürasyon (limitler vb)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, feature_id)
);

-- 3. RLS Ayarları
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_features ENABLE ROW LEVEL SECURITY;

-- Politikalar: Herkes (veya en azından ilgili roller) özellikleri görebilir
DROP POLICY IF EXISTS "features_read_all" ON public.features;
CREATE POLICY "features_read_all" ON public.features FOR SELECT USING (true);

-- İşletme sahipleri kendi özelliklerini görebilir
DROP POLICY IF EXISTS "business_features_owner_read" ON public.business_features;
CREATE POLICY "business_features_owner_read" ON public.business_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_owners bo
      WHERE bo.business_id = public.business_features.business_id
      AND bo.user_id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

-- Sadece Super Admin özellik ekleyebilir veya değiştirebilir
DROP POLICY IF EXISTS "super_admin_manage_features" ON public.features;
CREATE POLICY "super_admin_manage_features" ON public.features 
  FOR ALL USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

DROP POLICY IF EXISTS "super_admin_manage_business_features" ON public.business_features;
CREATE POLICY "super_admin_manage_business_features" ON public.business_features
  FOR ALL USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

-- 4. Yardımcı Fonksiyon: Özellik Kontrolü
CREATE OR REPLACE FUNCTION public.check_feature_access(p_business_id UUID, p_feature_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_features bf
    JOIN public.features f ON f.id = bf.feature_id
    WHERE bf.business_id = p_business_id
    AND f.key = p_feature_key
    AND bf.is_enabled = true
    AND (bf.valid_until IS NULL OR bf.valid_until > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed Verisi
INSERT INTO public.features (key, display_name, description) VALUES
  ('ai_assistant', 'Yapay Zeka Asistanı', 'Müşterilere akıllı randevu önerileri sunan ve işletme verilerini analiz eden AI desteği.'),
  ('advanced_analytics', 'Gelişmiş Analizler', 'Detaylı finansal raporlama ve personel verimlilik istatistikleri.'),
  ('online_payment', 'Online Ödeme', 'Randevu sırasında kredi kartı ile ödeme alma özelliği.')
ON CONFLICT (key) DO NOTHING;
