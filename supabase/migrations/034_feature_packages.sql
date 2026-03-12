-- ============================================================
-- Phase 6 - Feature Packages (Migration 034)
-- ============================================================

-- 1. Paketler (Packages) Tablosu
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Paket-Özellik İlişkisi (Package Features)
CREATE TABLE public.package_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(package_id, feature_id)
);

-- 3. İşletmeler Tablosuna Paket, Fiyat ve Markalama Alanlarını Ekleme
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS branding_config JSONB DEFAULT '{}'::jsonb;

-- 4. RLS Ayarları
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;

-- Herkes paketleri görebilir (veya sadece satın alma aşamasında)
DROP POLICY IF EXISTS "packages_read_all" ON public.packages;
CREATE POLICY "packages_read_all" ON public.packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "package_features_read_all" ON public.package_features;
CREATE POLICY "package_features_read_all" ON public.package_features FOR SELECT USING (true);

-- Sadece Super Admin yönetebilir
DROP POLICY IF EXISTS "super_admin_manage_packages" ON public.packages;
CREATE POLICY "super_admin_manage_packages" ON public.packages 
  FOR ALL USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

DROP POLICY IF EXISTS "super_admin_manage_package_features" ON public.package_features;
CREATE POLICY "super_admin_manage_package_features" ON public.package_features
  FOR ALL USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

-- 5. Paket Değiştiğinde Özellikleri Senkronize Eden Fonksiyon
CREATE OR REPLACE FUNCTION public.sync_business_features_on_package_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer paket değiştiyse veya yeni eklendiyse
  IF (TG_OP = 'INSERT' AND NEW.package_id IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND (OLD.package_id IS DISTINCT FROM NEW.package_id)) THEN
    
    -- 1. Eski paketten/manuel gelen özellikleri temizle (İsteğe bağlı strateji)
    -- Burada sadece pakete bağlı olanları yönetmek daha güvenli olabilir.
    -- Şimdilik basitçe bu işletmeye ait tüm business_features kayıtlarını siliyoruz 
    -- ve yeni pakettekileri ekliyoruz.
    DELETE FROM public.business_features WHERE business_id = NEW.id;

    -- 2. Yeni pakete ait özellikleri ekle
    INSERT INTO public.business_features (business_id, feature_id, is_enabled)
    SELECT NEW.id, pf.feature_id, true
    FROM public.package_features pf
    WHERE pf.package_id = NEW.package_id
    ON CONFLICT (business_id, feature_id) DO UPDATE SET is_enabled = true;
    
    -- NOT: Manuel eklenen özellikler korunur, paket değişimi sadece paketin getirdiği özellikleri ON yapar.
    -- Eğer belirli bir kısıtlama isterseniz buraya 'pakette olmayanları kapat' mantığı eklenebilir.
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5b. Paket Özellikleri Değiştiğinde İşletmeleri Güncelleyen Fonksiyon
CREATE OR REPLACE FUNCTION public.sync_businesses_on_package_features_change()
RETURNS TRIGGER AS $$
DECLARE
  v_pkg_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN v_pkg_id := OLD.package_id; ELSE v_pkg_id := NEW.package_id; END IF;

  -- Bu pakete sahip tüm işletmeleri güncelle (Trigger yardımıyla)
  -- package_id'yi kendisine eşitlemek AFTER UPDATE trigger'ını tetikler
  UPDATE public.businesses SET package_id = package_id WHERE package_id = v_pkg_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger Oluşturma
DROP TRIGGER IF EXISTS trg_sync_features_on_biz_update ON public.businesses;
CREATE TRIGGER trg_sync_features_on_biz_update
  AFTER INSERT OR UPDATE OF package_id ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.sync_business_features_on_package_change();

DROP TRIGGER IF EXISTS trg_sync_biz_on_pf_change ON public.package_features;
CREATE TRIGGER trg_sync_biz_on_pf_change
  AFTER INSERT OR UPDATE OR DELETE ON public.package_features
  FOR EACH ROW EXECUTE FUNCTION public.sync_businesses_on_package_features_change();

-- 7. Seed: Başlangıç Paketleri
INSERT INTO public.packages (name, description, price_monthly, price_yearly) VALUES
  ('Başlangıç', 'Temel randevu özellikleri içerir.', 0, 0),
  ('Profesyonel', 'AI Asistanı ve Gelişmiş Analizler içerir.', 299, 2990),
  ('Enterprise', 'Tüm özellikler ve sınırsız kapasite.', 599, 5990)
ON CONFLICT (name) DO NOTHING;

-- 'Başlangıç' paketine özellik yok veya temel özellikler
-- 'Profesyonel' paketine AI ve Analiz ekle
DO $$
DECLARE
  v_pro_id UUID;
  v_ai_id UUID;
  v_stats_id UUID;
BEGIN
  SELECT id INTO v_pro_id FROM public.packages WHERE name = 'Profesyonel';
  SELECT id INTO v_ai_id FROM public.features WHERE key = 'ai_assistant';
  SELECT id INTO v_stats_id FROM public.features WHERE key = 'advanced_analytics';

  IF v_pro_id IS NOT NULL AND v_ai_id IS NOT NULL THEN
    INSERT INTO public.package_features (package_id, feature_id) VALUES (v_pro_id, v_ai_id) ON CONFLICT DO NOTHING;
  END IF;
  IF v_pro_id IS NOT NULL AND v_stats_id IS NOT NULL THEN
    INSERT INTO public.package_features (package_id, feature_id) VALUES (v_pro_id, v_stats_id) ON CONFLICT DO NOTHING;
  END IF;
END $$;
