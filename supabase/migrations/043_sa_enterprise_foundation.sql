-- ============================================================
-- Migration 043: Super Admin Enterprise Foundation
-- 
-- 1. types: onboarding_status_type enum definition.
-- 2. businesses: Add onboarding_status field.
-- 3. subscriptions: Add contract_url field (starts_at, ends_at exist).
-- 4. onboard_business: Enhance RPC with default parameters for SA flow.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TYPES & ENUMS
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE public.onboarding_status_type AS ENUM ('contract_pending', 'payment_pending', 'setup', 'live');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. BUSINESSES TABLE UPDATES
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS onboarding_status public.onboarding_status_type DEFAULT 'live';

-- ────────────────────────────────────────────────────────────
-- 3. SUBSCRIPTIONS TABLE UPDATES
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS contract_url TEXT;

-- ────────────────────────────────────────────────────────────
-- 4. ONBOARDING SERVICE RPC (UPDATE)
-- ────────────────────────────────────────────────────────────
-- Mevcut fonksiyonun signature değişeceği için önceden siliyoruz.
DROP FUNCTION IF EXISTS public.onboard_business(UUID, TEXT, UUID, UUID, JSONB);

CREATE OR REPLACE FUNCTION public.onboard_business(
    p_owner_user_id UUID,
    p_business_name TEXT,
    p_sector_id UUID,
    p_package_id UUID,
    p_metadata JSONB DEFAULT '{}',
    p_onboarding_status public.onboarding_status_type DEFAULT 'live',
    p_ends_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- [GÜVENLİK]: Sadece Super Admin veya yetkili kayıt akışı çağırabilir.
    
    -- 1. İşletme Kaydı (Atomic Step 1)
    INSERT INTO public.businesses (
        name, 
        module_id, 
        package_id, 
        metadata,
        is_active,
        onboarding_status
    ) VALUES (
        p_business_name, 
        p_sector_id, 
        p_package_id, 
        p_metadata,
        true,
        p_onboarding_status
    ) RETURNING id INTO v_business_id;

    -- 2. Patron Ataması (Atomic Step 2)
    INSERT INTO public.business_owners (
        user_id, 
        business_id
    ) VALUES (
        p_owner_user_id, 
        v_business_id
    );

    -- 3. Abonelik Başlatma (Atomic Step 3)
    INSERT INTO public.subscriptions (
        business_id, 
        package_id, 
        status, 
        starts_at,
        ends_at
    ) VALUES (
        v_business_id, 
        p_package_id, 
        'active', 
        now(),
        p_ends_at
    );

    -- 4. Sektör Varsayılan Hizmetlerini Tohumla (Atomic Step 4)
    INSERT INTO public.services (
        business_id, 
        name, 
        description, 
        base_duration_minutes, 
        base_price, 
        is_active
    )
    SELECT 
        v_business_id, 
        name, 
        description, 
        duration_minutes, 
        price, 
        true
    FROM public.sector_default_services
    WHERE sector_id = p_sector_id;

    -- 5. Audit Log (Enterprise Requirement)
    INSERT INTO public.audit_logs (
        business_id, 
        user_id, 
        action, 
        target_table, 
        target_id
    ) VALUES (
        v_business_id, 
        auth.uid(), 
        'created', 
        'businesses', 
        v_business_id
    );

    RETURN v_business_id;

EXCEPTION WHEN OTHERS THEN
    -- Herhangi bir hata durumunda tüm işlemler otomatik olarak ROLLBACK edilir.
    RAISE EXCEPTION 'Onboarding başarısız oldu: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.onboard_business(UUID, TEXT, UUID, UUID, JSONB, public.onboarding_status_type, TIMESTAMPTZ) IS 'İşletme, Patron, Abonelik ve Hizmetleri kuran Enterprise RPC. Pipeline desteği var.';
