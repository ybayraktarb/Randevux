-- ============================================================
-- Sprint 13 - Storefront Görünürlük, Personel ve Şema Düzeltmesi (V3 - Kapsamlı)
-- ============================================================

-- 1. Services Tablosuna Eksik Kolonu Ekle
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Genel';

-- 2. Hizmetler (Services) için RLS'i Esnet
DROP POLICY IF EXISTS "services_select_restricted" ON public.services;
DROP POLICY IF EXISTS "services_select_discovery" ON public.services;
CREATE POLICY "services_select_discovery"
  ON public.services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.services.business_id
      AND (
        EXISTS (SELECT 1 FROM public.business_customers bc WHERE bc.business_id = b.id AND bc.user_id = auth.uid())
        OR (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
      )
    )
  );

-- 3. Personeller (Staff Business) için RLS'i Esnet
DROP POLICY IF EXISTS "staff_business_select_restricted" ON public.staff_business;
DROP POLICY IF EXISTS "staff_business_select_discovery" ON public.staff_business;
CREATE POLICY "staff_business_select_discovery"
  ON public.staff_business FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.staff_business.business_id
      AND (
        EXISTS (SELECT 1 FROM public.business_customers bc WHERE bc.business_id = b.id AND bc.user_id = auth.uid())
        OR (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
      )
    )
  );

-- 4. Personel Hizmet İlişkileri (Staff Services) için RLS Ekle
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_services_select_discovery" ON public.staff_services;
CREATE POLICY "staff_services_select_discovery"
  ON public.staff_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      JOIN public.businesses b ON b.id = sb.business_id
      WHERE sb.id = public.staff_services.staff_business_id
      AND (
        EXISTS (SELECT 1 FROM public.business_customers bc WHERE bc.business_id = b.id AND bc.user_id = auth.uid())
        OR (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
      )
    )
  );

-- 5. Kullanıcı İsimleri için RLS'i Esnet
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_select_discovery" ON public.users;
CREATE POLICY "users_select_discovery"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      JOIN public.businesses b ON b.id = sb.business_id
      WHERE sb.user_id = public.users.id
      AND (
        EXISTS (SELECT 1 FROM public.business_customers bc WHERE bc.business_id = b.id AND bc.user_id = auth.uid())
        OR (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
      )
    )
  );

-- 6. Müsaitlik Hesaplama (Appointments & Leaves) için Minimum Görünürlük
-- Diğer müşteriler hangi saatlerin DOLU olduğunu görebilmeli (detayları görmeden)
DROP POLICY IF EXISTS "appointments_select_available" ON public.appointments;
CREATE POLICY "appointments_select_available"
  ON public.appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.appointments.business_id
      AND (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "leaves_select_available" ON public.leave_requests;
CREATE POLICY "leaves_select_available"
  ON public.leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      JOIN public.businesses b ON b.id = sb.business_id
      WHERE sb.id = public.leave_requests.staff_business_id
      AND (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
    )
  );

-- 7. Veri Temizliği
UPDATE public.services SET category = 'Genel' WHERE category IS NULL;
