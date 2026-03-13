-- ============================================================
-- Migration 052: Sprint 5 - Self-Service Kayıt Düzeltmeleri (FINAL ADAPTATION)
--
-- 1. Enum Update: onboarding_status_type tablosuna 'trialing' ekle
-- 2. onboard_business: p_onboarding_status tipini TEXT yaparak
--    transaction kısıtlamasını (unsafe use of new value) aş.
-- 3. Subscriptions: trial için ends_at otomatik +14 gün
-- 4. Businesses: phone kolonu ekleniyor (eğer yoksa)
-- ============================================================

-- 1. Enum tipini güncelle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'onboarding_status_type' AND e.enumlabel = 'trialing'
    ) THEN
        ALTER TYPE public.onboarding_status_type ADD VALUE 'trialing';
    END IF;
END $$;

-- 2. businesses tablosuna phone kolonu ekle (idempotent)
ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. onboard_business fonksiyonunu güncelle:
--    Not: p_onboarding_status parametresini TEXT yaptık. 
--    Böylece yeni eklenen 'trialing' değeri parse-time hatası vermez.
CREATE OR REPLACE FUNCTION public.onboard_business(
    p_owner_user_id UUID,
    p_business_name TEXT,
    p_sector_id UUID,
    p_package_id UUID,
    p_metadata JSONB DEFAULT '{}',
    p_onboarding_status TEXT DEFAULT 'trialing', -- TEXT kullanıyoruz
    p_ends_at TIMESTAMPTZ DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_business_id UUID;
    v_trial_ends_at TIMESTAMPTZ;
BEGIN
    -- Trial bitiş tarihi: eğer açıkça verilmediyse +14 gün hesapla
    v_trial_ends_at := COALESCE(p_ends_at, now() + INTERVAL '14 days');

    -- 1. İşletme Kaydı (Atomic Step 1)
    INSERT INTO public.businesses (
        name,
        module_id,
        package_id,
        metadata,
        phone,
        is_active,
        onboarding_status
    ) VALUES (
        p_business_name,
        p_sector_id,
        p_package_id,
        p_metadata,
        p_phone,
        true,
        p_onboarding_status::public.onboarding_status_type -- Buradaki casting execution-time'da çalışır
    ) RETURNING id INTO v_business_id;

    -- 2. Patron Ataması (Atomic Step 2)
    INSERT INTO public.business_owners (
        user_id,
        business_id
    ) VALUES (
        p_owner_user_id,
        v_business_id
    );

    -- 3. Abonelik Başlatma - trialing durumuyla ve 14 günlük trial (Atomic Step 3)
    INSERT INTO public.subscriptions (
        business_id,
        package_id,
        status,
        starts_at,
        ends_at
    ) VALUES (
        v_business_id,
        p_package_id,
        CASE
            WHEN p_onboarding_status = 'trialing' THEN 'trialing'
            ELSE 'active'
        END,
        now(),
        CASE
            WHEN p_onboarding_status = 'trialing' THEN v_trial_ends_at
            ELSE p_ends_at
        END
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

    -- 5. Varsayılan Çalışma Saatleri (Atomic Step 5)
    INSERT INTO public.business_hours (business_id, day_of_week, open_time, close_time, is_open)
    VALUES
        (v_business_id, 1, '09:00', '18:00', true),
        (v_business_id, 2, '09:00', '18:00', true),
        (v_business_id, 3, '09:00', '18:00', true),
        (v_business_id, 4, '09:00', '18:00', true),
        (v_business_id, 5, '09:00', '18:00', true),
        (v_business_id, 6, '09:00', '18:00', true),
        (v_business_id, 0, '09:00', '18:00', false);

    -- 6. Patronun İlk Personel Olarak Atanması (Atomic Step 6)
    INSERT INTO public.staff_business (
        user_id,
        business_id,
        can_set_own_price,
        can_set_own_duration,
        is_active
    ) VALUES (
        p_owner_user_id,
        v_business_id,
        true,
        true,
        true
    );

    -- 7. Audit Log (Atomic Step 7)
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
    RAISE EXCEPTION 'Onboarding başarısız oldu: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
