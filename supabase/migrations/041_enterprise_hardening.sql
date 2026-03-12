-- ============================================================
-- Migration 041: Enterprise SaaS Hardening (Final Polish)
-- 
-- 1. Soft Delete: deleted_at kolonu ve indexlemeler.
-- 2. Metadata Flex: businesses tablosuna genel metadata JSONB.
-- 3. Hard Multi-Tenancy: audit_logs ve notifications tablolarına business_id.
-- 4. Single-Query Limits: packages tablosuna sayısal limit kolonları.
-- 5. Logic Refactor: check_business_limit() artık DB kolonlarını okur.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SOFT DELETE (Traceability)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.staff_business ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_businesses_deleted_at ON public.businesses(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON public.appointments(deleted_at) WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────
-- 2. METADATA FLEX (Sectoral Flexibility)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.businesses.metadata IS 'Sektöre özel dinamik ayarlar (Berber: sakal_tipleri, Veteriner: pati_notlari vb.)';

-- ────────────────────────────────────────────────────────────
-- 3. HARD MULTI-TENANCY (Isolation Tracking)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON public.audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business ON public.notifications(business_id);

-- ────────────────────────────────────────────────────────────
-- 4. SINGLE-QUERY LIMITS (Enterprise Scale)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.packages 
  ADD COLUMN IF NOT EXISTS max_staff INT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS max_services INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_appointments_per_month INT DEFAULT 100;

-- Paket limitlerini güncelle (Örnek veriler)
UPDATE public.packages SET max_staff = 2, max_services = 5, max_appointments_per_month = 50 WHERE name = 'Başlangıç';
UPDATE public.packages SET max_staff = 10, max_services = 50, max_appointments_per_month = 500 WHERE name = 'Profesyonel';
UPDATE public.packages SET max_staff = 999, max_services = 999, max_appointments_per_month = 9999 WHERE name = 'Enterprise';

-- ────────────────────────────────────────────────────────────
-- 5. LOGIC REFACTOR (Product-Grade Execution)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_business_limit(
    p_business_id UUID,
    p_feature_key VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_package RECORD;
    v_current_count INTEGER;
    v_is_enabled BOOLEAN;
BEGIN
    -- 1. Tek sorguyla paket limitlerini ve durumu al (Enterprise Req #3)
    SELECT p.* INTO v_package 
    FROM public.businesses b
    JOIN public.packages p ON p.id = b.package_id
    WHERE b.id = p_business_id AND b.deleted_at IS NULL;
    
    IF NOT FOUND THEN RETURN FALSE; END IF;

    -- 2. Feature Flag kontrolü
    SELECT is_enabled INTO v_is_enabled 
    FROM public.business_features bf
    JOIN public.features f ON f.id = bf.feature_id
    WHERE bf.business_id = p_business_id AND f.key = p_feature_key;

    IF v_is_enabled = false THEN RETURN FALSE; END IF;

    -- 3. Sayısal Limit Kontrolleri (Hardcoded değil, DB kolonlarından)
    IF p_feature_key = 'staff_management' THEN
        SELECT COUNT(*) INTO v_current_count 
        FROM public.staff_business 
        WHERE business_id = p_business_id AND is_active = true AND deleted_at IS NULL;
        
        IF v_current_count >= v_package.max_staff THEN RETURN FALSE; END IF;
    END IF;

    -- Gelecekte eklenecek limitler (service_management vb.) buraya eklenebilir
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
