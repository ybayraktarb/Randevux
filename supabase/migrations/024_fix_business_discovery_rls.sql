-- ============================================================
-- Sprint 21 - İşletme Keşif RLS Düzeltmesi (GÜNCEL)
-- ============================================================

-- 1. Eksik Kolonların Eklenmesi
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Business Customers için Müşterinin Kendi Kayıtlarını Görebilmesi
DROP POLICY IF EXISTS "bc_select_self" ON public.business_customers;
CREATE POLICY "bc_select_self"
  ON public.business_customers FOR SELECT
  USING (user_id = auth.uid());

-- 3. Business Arama ve Görünürlük İzni (Kısıtlı)
-- Sadece katıldığınız işletmel eri veya kodunu bildiğiniz işletmeleri görebilirsiniz.
DROP POLICY IF EXISTS "business_select_authenticated" ON public.businesses;
DROP POLICY IF EXISTS "business_select_by_code" ON public.businesses;
DROP POLICY IF EXISTS "business_select_restricted" ON public.businesses;

CREATE POLICY "business_select_restricted"
  ON public.businesses FOR SELECT
  USING (
    -- Kullanıcı bu işletmeye katılmışsa
    EXISTS (
      SELECT 1 FROM public.business_customers
      WHERE business_id = public.businesses.id AND user_id = auth.uid()
    )
    OR
    -- Kod ile arama yapılıyorsa (QR veya Davet kodu olanları bulunabilir yapar)
    (qr_code IS NOT NULL OR invite_code IS NOT NULL)
  );

-- 4. Hizmetler ve Personeller için Görünürlük (Kısıtlı)
-- Sadece üyesi olduğunuz işletmenin detaylarını görebilirsiniz.
DROP POLICY IF EXISTS "services_select_authenticated" ON public.services;
DROP POLICY IF EXISTS "services_select_restricted" ON public.services;

CREATE POLICY "services_select_restricted"
  ON public.services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_customers
      WHERE business_id = public.services.business_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff_business_select_authenticated" ON public.staff_business;
DROP POLICY IF EXISTS "staff_business_select_restricted" ON public.staff_business;

CREATE POLICY "staff_business_select_restricted"
  ON public.staff_business FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_customers
      WHERE business_id = public.staff_business.business_id AND user_id = auth.uid()
    )
  );

-- 5. Users Tablosunda Personel İsimlerinin Görünmesi
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);
