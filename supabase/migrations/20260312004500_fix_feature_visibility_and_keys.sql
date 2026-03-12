-- ============================================================
-- Migration: Add Staff Access to Features & Missing Keys
-- ============================================================

-- 1. RLS: business_features - Personel (Staff) okuma yetkisi ekle
-- AppShellLayout'un özellikleri çekebilmesi için personelin kendi işletmesinin özelliklerini görebilmesi gerekir.

DROP POLICY IF EXISTS "business_features_staff_read" ON public.business_features;
CREATE POLICY "business_features_staff_read" ON public.business_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      WHERE sb.business_id = public.business_features.business_id
        AND sb.user_id = auth.uid()
        AND sb.is_active = true
    )
  );

-- 2. Missing Feature Keys: inventory_module ve finance_module
-- Navigasyon menüsünde kullanılan ancak veritabanında eksik olan anahtarları ekle.

INSERT INTO public.features (key, display_name, description) VALUES
  ('inventory_module', 'Ürünler & Depo Yönetimi', 'Stok takibi, ürün yönetimi ve envanter analizleri modülü.'),
  ('finance_module', 'Finans & Muhasebe', 'Kasa yönetimi, gider takibi ve finansal raporlama modülü.')
ON CONFLICT (key) DO NOTHING;

COMMENT ON POLICY "business_features_staff_read" ON public.business_features IS
  'Personel kendi aktif işletmesinin yan menü özelliklerini görebilir.';
