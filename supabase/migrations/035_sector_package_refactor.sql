-- ============================================================
-- Migration 035: Sector & Package Architecture Refactor
-- 
-- Değişiklikler:
--   1. modules tablosunu "sectors" olarak zenginleştir (geriye uyumlu)
--   2. packages tablosuna sector_id ekle
--   3. sector_default_features tablosu oluştur
--   4. business_features'a kaynak takibi ekle (paket mi, sektör mü, manuel mi)
--   5. sync trigger'ını düzelt (manuel özellikler artık korunuyor)
--   6. uuid_generate_v4() → gen_random_uuid() tutarsızlıklarını düzelt
--   7. Mevcut veriyi yeni yapıya migrate et
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. MODULES TABLOSUNU ZENGİNLEŞTİR (Sektör kimliği)
--    modules tablosu rename edilmez — view + yeni kolonlar
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'scissors',          -- Lucide icon adı
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1',          -- Sektör teması
  ADD COLUMN IF NOT EXISTS is_available_for_new_businesses BOOLEAN DEFAULT true;

-- Geriye uyumlu alias view: kod içinde modules yerine sectors de yazılabilir
CREATE OR REPLACE VIEW public.sectors AS
  SELECT
    id,
    name,
    display_name,
    description,
    icon,
    color,
    is_active,
    is_available_for_new_businesses,
    config,
    created_at
  FROM public.modules;

COMMENT ON VIEW public.sectors IS 'modules tablosunun geriye uyumlu alias view''u. Yeni kodda bu view kullanılır.';


-- ────────────────────────────────────────────────────────────
-- 2. MEVCUT SEKTÖR VERİSİNİ ENRICH ET
-- ────────────────────────────────────────────────────────────

UPDATE public.modules SET
  description = 'Saç, sakal ve güzellik hizmetleri sunan işletmeler için randevu, stok ve finans yönetimi.',
  icon = 'scissors',
  color = '#8b5cf6',
  is_available_for_new_businesses = true
WHERE name = 'barber';

UPDATE public.modules SET
  description = 'Hayvan sağlığı ve bakım hizmetleri için randevu ve hasta takip sistemi.',
  icon = 'heart-pulse',
  color = '#10b981',
  is_available_for_new_businesses = false
WHERE name = 'veterinary';

UPDATE public.modules SET
  description = 'Klinik ve sağlık merkezi randevu, hasta kayıt ve takip sistemi.',
  icon = 'stethoscope',
  color = '#0ea5e9',
  is_available_for_new_businesses = false
WHERE name = 'health';


-- ────────────────────────────────────────────────────────────
-- 3. PACKAGES TABLOSUNA SECTOR_ID EKLE
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,  -- Landing page'de öne çıkarılsın mı
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;           -- Listeleme sırası

-- Mevcut paketleri barber sektörüne ata
DO $$
DECLARE v_barber_id UUID;
BEGIN
  SELECT id INTO v_barber_id FROM public.modules WHERE name = 'barber';
  IF v_barber_id IS NOT NULL THEN
    UPDATE public.packages SET sector_id = v_barber_id, sort_order = CASE
      WHEN name = 'Başlangıç'    THEN 1
      WHEN name = 'Profesyonel'  THEN 2
      WHEN name = 'Enterprise'   THEN 3
      ELSE 99
    END;
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_packages_sector ON public.packages(sector_id);


-- ────────────────────────────────────────────────────────────
-- 4. SECTOR_DEFAULT_FEATURES TABLOSU
--    Bir sektör işletmesine kayıt olunca otomatik açılan özellikler
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sector_default_features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id   UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  feature_id  UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sector_id, feature_id)
);

ALTER TABLE public.sector_default_features ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (işletme kayıt akışında hangi özellikler gelecek diye bakılır)
DROP POLICY IF EXISTS "sector_default_features_read_all" ON public.sector_default_features;
CREATE POLICY "sector_default_features_read_all"
  ON public.sector_default_features FOR SELECT USING (true);

-- Sadece super admin yönetebilir
DROP POLICY IF EXISTS "super_admin_manage_sector_defaults" ON public.sector_default_features;
CREATE POLICY "super_admin_manage_sector_defaults"
  ON public.sector_default_features FOR ALL
  USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

COMMENT ON TABLE public.sector_default_features IS
  'Sektör açıldığında işletmeye otomatik atanan özellikler. '
  'Paketle veya manuel özelliklerden bağımsız her zaman aktiftir.';


-- ────────────────────────────────────────────────────────────
-- 5. BUSINESS_FEATURES'A KAYNAK TAKİBİ EKLE
--    Bir özelliğin nereden geldiğini izle: paket / sektör / manuel
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_features'
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.business_features
      ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('package', 'sector_default', 'manual'));
    COMMENT ON COLUMN public.business_features.source IS
      'package: paketten geldi | sector_default: sektör varsayılanı | manual: super admin elle ekledi';
  END IF;
END $$;

-- Mevcut kayıtları 'manual' olarak işaretle (güvenli default)
UPDATE public.business_features SET source = 'manual' WHERE source IS NULL OR source = 'manual';


-- ────────────────────────────────────────────────────────────
-- 6. SYNC TRIGGER DÜZELTME
--    Eski: paket değişince TÜM business_features siliniyordu
--    Yeni: sadece 'package' kaynaklılar güncellenir, 'manual' ve
--          'sector_default' dokunulmaz
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_business_features_on_package_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.package_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND (OLD.package_id IS DISTINCT FROM NEW.package_id)) THEN

    -- 1. ESKİ PAKETTEN gelen özellikleri kaldır (sadece 'package' source'lular)
    DELETE FROM public.business_features
    WHERE business_id = NEW.id
      AND source = 'package';

    -- 2. YENİ PAKETİ varsa özellikleri ekle
    IF NEW.package_id IS NOT NULL THEN
      INSERT INTO public.business_features (business_id, feature_id, is_enabled, source)
      SELECT NEW.id, pf.feature_id, true, 'package'
      FROM public.package_features pf
      WHERE pf.package_id = NEW.package_id
      ON CONFLICT (business_id, feature_id) DO UPDATE
        SET is_enabled = true, source = 'package';
    END IF;

    -- NOT: 'manual' ve 'sector_default' kaynaklı özellikler korunur.

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger zaten migration 034'te oluşturuldu, fonksiyon güncellendi yeterli.
-- Eğer yoksa güvenlik için yeniden oluştur:
DROP TRIGGER IF EXISTS trg_sync_features_on_biz_update ON public.businesses;
CREATE TRIGGER trg_sync_features_on_biz_update
  AFTER INSERT OR UPDATE OF package_id ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.sync_business_features_on_package_change();


-- ────────────────────────────────────────────────────────────
-- 7. SEKTÖR VARSAYILAN ÖZELLİKLERİ SEED
--    Barber sektörü için temel özellikler
-- ────────────────────────────────────────────────────────────

-- Önce 'appointment_system' ve 'service_management' features ekle (varsa skip)
INSERT INTO public.features (key, display_name, description) VALUES
  ('appointment_system',   'Randevu Sistemi',    'Temel online randevu alma ve takvim yönetimi.')
 ,('service_management',   'Hizmet Yönetimi',    'İşletme hizmetlerini ve fiyatlandırmasını yönetme.')
 ,('staff_management',     'Personel Yönetimi',  'Personel ekleme, yetki ve takvim yönetimi.')
 ,('customer_management',  'Müşteri Yönetimi',   'Müşteri kayıtları, notlar ve geçmiş randevular.')
 ,('inventory_management', 'Stok Yönetimi',      'Ürün stok takibi ve satış entegrasyonu.')
 ,('finance_management',   'Finans Yönetimi',    'Kasa hareketleri, gelir/gider ve bordro yönetimi.')
ON CONFLICT (key) DO NOTHING;

-- Barber sektörünün varsayılan özellikleri
DO $$
DECLARE
  v_barber_id UUID;
  v_f         RECORD;
BEGIN
  SELECT id INTO v_barber_id FROM public.modules WHERE name = 'barber';
  IF v_barber_id IS NULL THEN RETURN; END IF;

  FOR v_f IN
    SELECT id FROM public.features
    WHERE key IN ('appointment_system', 'service_management', 'staff_management', 'customer_management')
  LOOP
    INSERT INTO public.sector_default_features (sector_id, feature_id)
    VALUES (v_barber_id, v_f.id)
    ON CONFLICT (sector_id, feature_id) DO NOTHING;
  END LOOP;
END $$;

-- Profesyonel pakete stok ve finans ekle
DO $$
DECLARE
  v_pro_id    UUID;
  v_ent_id    UUID;
  v_inv_id    UUID;
  v_fin_id    UUID;
  v_pay_id    UUID;
BEGIN
  SELECT id INTO v_pro_id FROM public.packages WHERE name = 'Profesyonel';
  SELECT id INTO v_ent_id FROM public.packages WHERE name = 'Enterprise';
  SELECT id INTO v_inv_id FROM public.features  WHERE key  = 'inventory_management';
  SELECT id INTO v_fin_id FROM public.features  WHERE key  = 'finance_management';
  SELECT id INTO v_pay_id FROM public.features  WHERE key  = 'online_payment';

  -- Profesyonel: stok + finans
  IF v_pro_id IS NOT NULL AND v_inv_id IS NOT NULL THEN
    INSERT INTO public.package_features (package_id, feature_id) VALUES (v_pro_id, v_inv_id) ON CONFLICT DO NOTHING;
  END IF;
  IF v_pro_id IS NOT NULL AND v_fin_id IS NOT NULL THEN
    INSERT INTO public.package_features (package_id, feature_id) VALUES (v_pro_id, v_fin_id) ON CONFLICT DO NOTHING;
  END IF;

  -- Enterprise: tümü
  IF v_ent_id IS NOT NULL AND v_inv_id IS NOT NULL THEN
    INSERT INTO public.package_features (package_id, feature_id) VALUES (v_ent_id, v_inv_id) ON CONFLICT DO NOTHING;
  END IF;
  IF v_ent_id IS NOT NULL AND v_fin_id IS NOT NULL THEN
    INSERT INTO public.package_features (package_id, feature_id) VALUES (v_ent_id, v_fin_id) ON CONFLICT DO NOTHING;
  END IF;
  IF v_ent_id IS NOT NULL AND v_pay_id IS NOT NULL THEN
    INSERT INTO public.package_features (package_id, feature_id) VALUES (v_ent_id, v_pay_id) ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 8. UUID TUTARSIZLIĞI DÜZELTMESİ
--    transactions, inventory_logs, products — uuid_generate_v4() → gen_random_uuid()
--    NOT: Sadece DEFAULT ifadesini değiştiriyoruz, mevcut veri dokunulmaz.
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.transactions
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.staff_commissions
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.payroll_records
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.products
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.inventory_logs
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.appointment_products
  ALTER COLUMN id SET DEFAULT gen_random_uuid();


-- ════════════════════════════════════════════════════════════
-- ✅ MIGRATION 035 TAMAMLANDI
--
-- Özet:
--   ✓ modules tablosu sectors view ile erişilebilir hale geldi
--   ✓ packages.sector_id eklendi, mevcut paketler barber'a bağlandı
--   ✓ sector_default_features tablosu oluşturuldu
--   ✓ business_features.source kolonu eklendi (package|sector_default|manual)
--   ✓ sync_business_features trigger düzeltildi (manuel özellikler korunuyor)
--   ✓ Barber sektörü varsayılan özellikleri eklendi
--   ✓ uuid_generate_v4() → gen_random_uuid() tutarsızlığı düzeltildi
-- ════════════════════════════════════════════════════════════
