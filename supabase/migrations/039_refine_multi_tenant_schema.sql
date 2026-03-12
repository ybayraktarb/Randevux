-- ============================================================
-- Migration 039: Subscription Management, History & Hard Limits
-- 
-- 1. Subscriptions & History: Aktif durum ve tarihsel takip.
-- 2. check_business_limit(): Merkezi limit sorgulama logic'i.
-- 3. trg_enforce_staff_limit: Veritabanı seviyesinde sert limit kontrolü.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SUBSCRIPTIONS (Aktif Abonelik)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'unpaid', 'trialing')),
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id)
);

-- ────────────────────────────────────────────────────────────
-- 2. SUBSCRIPTION_HISTORY (Geçmiş Kayıtlar - Audit Trail)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_at TIMESTAMPTZ DEFAULT now(),
  change_reason TEXT, -- 'upgrade', 'downgrade', 'cancellation'
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Politikalar
DROP POLICY IF EXISTS "subscriptions_read_policy" ON public.subscriptions;
CREATE POLICY "subscriptions_read_policy" ON public.subscriptions
  FOR SELECT USING (
    business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "sub_history_read_policy" ON public.subscription_history;
CREATE POLICY "sub_history_read_policy" ON public.subscription_history
  FOR SELECT USING (
    business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────
-- 3. AUTOMATIC HISTORY LOGGING TRIGGER
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer paket veya durum değiştiyse eskiyi geçmişe at
    IF (OLD.package_id IS DISTINCT FROM NEW.package_id) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.subscription_history (business_id, package_id, status, period_start, period_end, change_reason)
        VALUES (OLD.business_id, OLD.package_id, OLD.status, OLD.starts_at, now(), 
            CASE 
                WHEN OLD.package_id IS DISTINCT FROM NEW.package_id THEN 'package_change'
                ELSE 'status_change'
            END);
        
        -- Yeni aboneliğin başlangıç tarihini şimdi yap
        NEW.starts_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_sub_change ON public.subscriptions;
CREATE TRIGGER trg_log_sub_change
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.log_subscription_change();

-- ────────────────────────────────────────────────────────────
-- 4. MERKEZİ LİMİT KONTROL FONKSİYONU
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_business_limit(
    p_business_id UUID,
    p_feature_key VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_package_id UUID;
    v_package_name TEXT;
    v_current_count INTEGER;
    v_is_enabled BOOLEAN;
BEGIN
    SELECT b.package_id, p.name INTO v_package_id, v_package_name 
    FROM public.businesses b
    LEFT JOIN public.packages p ON p.id = b.package_id
    WHERE b.id = p_business_id;
    
    IF v_package_id IS NULL THEN RETURN FALSE; END IF;

    SELECT is_enabled INTO v_is_enabled 
    FROM public.business_features bf
    JOIN public.features f ON f.id = bf.feature_id
    WHERE bf.business_id = p_business_id AND f.key = p_feature_key;

    IF v_is_enabled = false THEN RETURN FALSE; END IF;

    IF p_feature_key = 'staff_management' THEN
        SELECT COUNT(*) INTO v_current_count 
        FROM public.staff_business 
        WHERE business_id = p_business_id AND is_active = true;
        
        IF v_package_name = 'Başlangıç' AND v_current_count >= 2 THEN RETURN FALSE;
        ELSIF v_package_name = 'Profesyonel' AND v_current_count >= 10 THEN RETURN FALSE;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 5. DATABASE TRIGGER: Sert Limit Zorlama
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_business_limits()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.check_business_limit(NEW.business_id, 'staff_management') THEN
        RAISE EXCEPTION 'Abonelik limitiniz doldu. Lütfen paketinizi yükseltin. (Staff Limit Exceeded)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_limit_staff_insert ON public.staff_business;
CREATE TRIGGER trg_limit_staff_insert
    BEFORE INSERT ON public.staff_business
    FOR EACH ROW EXECUTE FUNCTION public.enforce_business_limits();

-- ────────────────────────────────────────────────────────────
-- 6. INITIAL SYNC
-- ────────────────────────────────────────────────────────────
INSERT INTO public.subscriptions (business_id, package_id)
SELECT id, package_id FROM public.businesses
WHERE package_id IS NOT NULL
ON CONFLICT (business_id) DO NOTHING;
