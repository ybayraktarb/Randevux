-- ============================================================
-- Sprint 13 - Takvim ve Müsaitlik Görünürlüğü (RLS)
-- ============================================================

-- 1. İşletme Saatleri (Business Hours) için Discovery İzni
DROP POLICY IF EXISTS "bh_select_discovery" ON public.business_hours;
CREATE POLICY "bh_select_discovery"
  ON public.business_hours FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.business_hours.business_id
      AND (
        EXISTS (SELECT 1 FROM public.business_customers bc WHERE bc.business_id = b.id AND bc.user_id = auth.uid())
        OR (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
      )
    )
  );

-- 2. Personel Çalışma Şablonları (Work Schedule Templates) için Discovery İzni
DROP POLICY IF EXISTS "wst_select_discovery" ON public.work_schedule_templates;
CREATE POLICY "wst_select_discovery"
  ON public.work_schedule_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      JOIN public.businesses b ON b.id = sb.business_id
      WHERE sb.id = public.work_schedule_templates.staff_business_id
      AND (
        EXISTS (SELECT 1 FROM public.business_customers bc WHERE bc.business_id = b.id AND bc.user_id = auth.uid())
        OR (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
      )
    )
  );

-- 3. Mola Saatleri (Break Schedules) için Discovery İzni
DROP POLICY IF EXISTS "break_select_discovery" ON public.break_schedules;
CREATE POLICY "break_select_discovery"
  ON public.break_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      JOIN public.businesses b ON b.id = sb.business_id
      WHERE sb.id = public.break_schedules.staff_business_id
      AND (
        EXISTS (SELECT 1 FROM public.business_customers bc WHERE bc.business_id = b.id AND bc.user_id = auth.uid())
        OR (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
      )
    )
  );

-- 4. Kapalı Günler (Business Closed Dates) için Discovery İzni
DROP POLICY IF EXISTS "bcd_select_discovery" ON public.business_closed_dates;
CREATE POLICY "bcd_select_discovery"
  ON public.business_closed_dates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = public.business_closed_dates.business_id
      AND (
        EXISTS (SELECT 1 FROM public.business_customers bc WHERE bc.business_id = b.id AND bc.user_id = auth.uid())
        OR (b.qr_code IS NOT NULL OR b.invite_code IS NOT NULL)
      )
    )
  );
