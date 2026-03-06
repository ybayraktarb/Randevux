-- ============================================================
-- RandevuX — Sprint 1: Staff Schedule & Service Management
-- Migration 017
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. EKSİK RLS POLİTİKALARINI ETKİNLEŞTİRME
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_schedules ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 2. BUSINESS HOURS POLİTİKALARI
-- ────────────────────────────────────────────────────────────
-- Herkes işletme saatlerini okuyabilir (müşteriler randevu alırken görebilmeli)
CREATE POLICY "Anyone can view business hours"
  ON public.business_hours FOR SELECT
  USING (true);

-- İşletme sahipleri kendi işletmelerinin saatlerini yönetebilir
CREATE POLICY "Owners can manage own business hours"
  ON public.business_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_owners
      WHERE business_owners.business_id = business_hours.business_id
        AND business_owners.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 3. WORK SCHEDULE TEMPLATES POLİTİKALARI
-- ────────────────────────────────────────────────────────────
-- Personeller kendi çalışma saatlerini görebilir
CREATE POLICY "Staff can view own work schedules"
  ON public.work_schedule_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      WHERE sb.id = work_schedule_templates.staff_business_id
        AND sb.user_id = auth.uid()
    )
  );

-- İşletme sahipleri kendi işletmelerindeki personelin çalışma saatlerini görebilir ve yönetebilir
CREATE POLICY "Owners can manage staff work schedules"
  ON public.work_schedule_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      JOIN public.business_owners bo ON bo.business_id = sb.business_id
      WHERE sb.id = work_schedule_templates.staff_business_id
        AND bo.user_id = auth.uid()
    )
  );
  
-- Müşteriler randevu alırken personelin çalışma saatlerini görebilmeli
CREATE POLICY "Customers can view staff work schedules"
  ON public.work_schedule_templates FOR SELECT
  USING (true);


-- ────────────────────────────────────────────────────────────
-- 4. BREAK SCHEDULES POLİTİKALARI
-- ────────────────────────────────────────────────────────────
-- Personeller kendi mola saatlerini görebilir
CREATE POLICY "Staff can view own break schedules"
  ON public.break_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      WHERE sb.id = break_schedules.staff_business_id
        AND sb.user_id = auth.uid()
    )
  );

-- İşletme sahipleri kendi işletmelerindeki personelin molalarını görebilir ve yönetebilir
CREATE POLICY "Owners can manage staff break schedules"
  ON public.break_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      JOIN public.business_owners bo ON bo.business_id = sb.business_id
      WHERE sb.id = break_schedules.staff_business_id
        AND bo.user_id = auth.uid()
    )
  );
  
-- Müşteriler randevu alırken personelin mola saatlerini görebilmeli
CREATE POLICY "Customers can view staff break schedules"
  ON public.break_schedules FOR SELECT
  USING (true);

-- ════════════════════════════════════════════════════════════
-- ✅ 017 — SPRINT 1 STAFF SCHEDULE MANAGEMENT RLS APPLIED
-- ════════════════════════════════════════════════════════════
