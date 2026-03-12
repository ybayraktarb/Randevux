-- ============================================================
-- Migration: 20260312004600_subscription_lifecycle_automation
-- Description: Automates the 14-day trial period for new businesses and 
--              provides a mechanism to update expired subscription statuses.
-- ============================================================

-- 1. update onboard_business to support automatic trial
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
    v_actual_ends_at TIMESTAMPTZ;
    v_initial_status TEXT;
BEGIN
    -- EKLENDI: Eğer bitiş tarihi verilmemişse varsayılan 14 gün TRIAL veriyoruz.
    IF p_ends_at IS NULL THEN
        v_actual_ends_at := now() + INTERVAL '14 days';
        v_initial_status := 'trialing';
    ELSE
        v_actual_ends_at := p_ends_at;
        v_initial_status := 'active';
    END IF;

    -- 1. İşletme Kaydı
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

    -- 2. Patron Ataması
    INSERT INTO public.business_owners (user_id, business_id) 
    VALUES (p_owner_user_id, v_business_id);

    -- 3. Abonelik Başlatma (GÜNCELLENDI: Status ve Ends At logic eklendi)
    INSERT INTO public.subscriptions (
        business_id, 
        package_id, 
        status, 
        starts_at,
        ends_at
    ) VALUES (
        v_business_id, 
        p_package_id, 
        v_initial_status, 
        now(),
        v_actual_ends_at
    );

    -- 4. Sektör Varsayılan Hizmetlerini Tohumla
    INSERT INTO public.services (business_id, name, description, base_duration_minutes, base_price, is_active)
    SELECT v_business_id, name, description, duration_minutes, price, true
    FROM public.sector_default_services
    WHERE sector_id = p_sector_id;

    -- 5. Varsayılan Çalışma Saatleri
    INSERT INTO public.business_hours (business_id, day_of_week, open_time, close_time, is_open)
    VALUES 
        (v_business_id, 1, '09:00', '18:00', true),
        (v_business_id, 2, '09:00', '18:00', true),
        (v_business_id, 3, '09:00', '18:00', true),
        (v_business_id, 4, '09:00', '18:00', true),
        (v_business_id, 5, '09:00', '18:00', true),
        (v_business_id, 6, '09:00', '18:00', true),
        (v_business_id, 0, '09:00', '18:00', false);

    -- 6. Patronun İlk Personel (Staff) Olarak Atanması
    INSERT INTO public.staff_business (user_id, business_id, can_set_own_price, can_set_own_duration, is_active)
    VALUES (p_owner_user_id, v_business_id, true, true, true);

    -- 7. Audit Log
    INSERT INTO public.audit_logs (business_id, user_id, action, target_table, target_id)
    VALUES (v_business_id, p_owner_user_id, 'created', 'businesses', v_business_id);

    RETURN v_business_id;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Onboarding başarısız oldu: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Sistem Fonksiyonu: Süresi dolan abonelikleri güncelle
-- Bu fonksiyon cron ile (Supabase Edge Function) veya manuel tetiklenebilir.
CREATE OR REPLACE FUNCTION public.update_subscription_statuses()
RETURNS JSONB AS $$
DECLARE
    v_updated_count INT;
BEGIN
    -- Trial süresi bitenleri 'past_due' yap
    WITH updated AS (
        UPDATE public.subscriptions
        SET status = 'past_due',
            updated_at = now()
        WHERE status = 'trialing' 
          AND ends_at < now()
        RETURNING id
    )
    SELECT count(*) INTO v_updated_count FROM updated;

    -- Audit log ekle (İsteğe bağlı)
    IF v_updated_count > 0 THEN
        INSERT INTO public.audit_logs (action, target_table, metadata)
        VALUES ('updated', 'subscriptions', jsonb_build_object('reason', 'lifecycle_auto_update', 'count', v_updated_count));
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'updated_count', v_updated_count,
        'message', 'Expired trials moved to past_due'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_subscription_statuses() IS 'Süresi dolan deneme süresi (trialing) aboneliklerini otomatik olarak past_due durumuna çeker.';
