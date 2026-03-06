-- ============================================================
-- RandevuX — Sprint 3: Business Closed Dates, Hours & Notifications RLS
-- Migration 019
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. BUSINESS CLOSED DATES RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.business_closed_dates ENABLE ROW LEVEL SECURITY;

-- İşletme sahibi kendi kapalı günlerini yönetir
CREATE POLICY "Owner manages closed dates"
  ON public.business_closed_dates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_owners bo
      WHERE bo.business_id = business_closed_dates.business_id
        AND bo.user_id = auth.uid()
    )
  );

-- İşletme personeli kendi işletmesinin kapalı günlerini görebilir
CREATE POLICY "Staff can view business closed dates"
  ON public.business_closed_dates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      WHERE sb.business_id = business_closed_dates.business_id
        AND sb.user_id = auth.uid()
    )
  );

-- Herkese okuma (Müşteri randevu alımında gereklidir)
CREATE POLICY "Public can read closed dates"
  ON public.business_closed_dates FOR SELECT
  USING (true);

-- ────────────────────────────────────────────────────────────
-- 2. BUSINESS HOURS RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- İşletme sahibi yönetir
CREATE POLICY "Owner manages business hours"
  ON public.business_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_owners bo
      WHERE bo.business_id = business_hours.business_id
        AND bo.user_id = auth.uid()
    )
  );

-- Herkese okuma
CREATE POLICY "Public can read business hours"
  ON public.business_hours FOR SELECT
  USING (true);

-- ────────────────────────────────────────────────────────────
-- 3. NOTIFICATIONS RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi bildirimlerini görebilir
CREATE POLICY "User can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Kullanıcı kendi bildirimlerini güncelleyebilir (is_read)
CREATE POLICY "User can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service role (admin) oluşturabilir
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);  -- server-side actions SECURITY DEFINER tarafından çağrılır

-- ────────────────────────────────────────────────────────────
-- 4. OWNER UPDATE BUSINESS HOURS RPC
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_business_hours(
    p_business_id UUID,
    p_hours JSONB  -- [{day_of_week, open_time, close_time, is_open}]
)
RETURNS JSONB AS $$
DECLARE
    v_hour JSONB;
BEGIN
    -- Patronun bu işletmeye sahip olduğunu doğrula
    IF NOT EXISTS (
        SELECT 1 FROM public.business_owners bo
        WHERE bo.business_id = p_business_id AND bo.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Bu işletme için yetkiniz yok.';
    END IF;

    FOR v_hour IN SELECT * FROM jsonb_array_elements(p_hours)
    LOOP
        INSERT INTO public.business_hours (business_id, day_of_week, open_time, close_time, is_open)
        VALUES (
            p_business_id,
            (v_hour->>'day_of_week')::SMALLINT,
            (v_hour->>'open_time')::TIME,
            (v_hour->>'close_time')::TIME,
            (v_hour->>'is_open')::BOOLEAN
        )
        ON CONFLICT (business_id, day_of_week)
        DO UPDATE SET
            open_time = EXCLUDED.open_time,
            close_time = EXCLUDED.close_time,
            is_open = EXCLUDED.is_open;
    END LOOP;

    RETURN jsonb_build_object('success', true);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Hata: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════
-- ✅ 019 — SPRINT 3 BUSINESS SETTINGS & NOTIFICATIONS RLS APPLIED
-- ════════════════════════════════════════════════════════════
