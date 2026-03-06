-- ============================================================
-- RandevuX — Sprint 2: Leave Management RLS & Policies
-- Migration 018
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. LEAVE REQUESTS RLS ETKİNLEŞTİRME
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Personel kendi izin taleplerini görebilir ve oluşturabilir
CREATE POLICY "Staff can view own leave requests"
  ON public.leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      WHERE sb.id = leave_requests.staff_business_id
        AND sb.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can create own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      WHERE sb.id = leave_requests.staff_business_id
        AND sb.user_id = auth.uid()
    )
  );

-- İşletme sahipleri kendi işletmelerindeki tüm izin taleplerini görebilir ve yönetebilir
CREATE POLICY "Owners can manage leave requests in their business"
  ON public.leave_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      JOIN public.business_owners bo ON bo.business_id = sb.business_id
      WHERE sb.id = leave_requests.staff_business_id
        AND bo.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 2. PATRONUN PERSONEL ADINA DOĞRUDAN İZİN AÇMASI RPC
-- (Onay bekleyen talep yerine direkt "approved" izin ekler)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.owner_add_staff_leave(
    p_staff_business_id UUID,
    p_request_type TEXT,        -- 'full_day' | 'partial'
    p_date DATE,
    p_start_time TIME DEFAULT NULL,
    p_end_time TIME DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_business_id UUID;
    v_new_leave_id UUID;
BEGIN
    -- Patronun bu personelin işletme sahibi olduğunu doğrula
    SELECT sb.business_id INTO v_business_id
    FROM public.staff_business sb
    JOIN public.business_owners bo ON bo.business_id = sb.business_id
    WHERE sb.id = p_staff_business_id
      AND bo.user_id = auth.uid();

    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'Bu personel için yetkiniz yok.';
    END IF;

    INSERT INTO public.leave_requests (
        staff_business_id,
        request_type,
        date,
        start_time,
        end_time,
        reason,
        status,
        reviewed_by,
        reviewed_at
    )
    VALUES (
        p_staff_business_id,
        p_request_type,
        p_date,
        p_start_time,
        p_end_time,
        p_reason,
        'approved',      -- Patron eklediği için direkt onaylı
        auth.uid(),
        now()
    )
    RETURNING id INTO v_new_leave_id;

    RETURN jsonb_build_object('success', true, 'leave_id', v_new_leave_id);

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Hata: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════
-- ✅ 018 — SPRINT 2 LEAVE MANAGEMENT RLS & RPC APPLIED
-- ════════════════════════════════════════════════════════════
