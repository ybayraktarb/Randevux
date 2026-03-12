-- ============================================================
-- Migration 048: Final Audit Log Column Fix in Onboarding RPC
-- 
-- Bu migration, onboard_business fonksiyonundaki son sütun 
-- uyumsuzluğunu (user_id -> changed_by vb.) giderir.
-- ============================================================

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
    INSERT INTO public.business_owners (
        user_id, 
        business_id
    ) VALUES (
        p_owner_user_id, 
        v_business_id
    );

    -- 3. Abonelik Başlatma
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

    -- 4. Sektör Varsayılan Hizmetlerini Tohumla
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

    -- 5. Varsayılan Çalışma Saatleri (is_open fix uygulanmıştı)
    INSERT INTO public.business_hours (business_id, day_of_week, open_time, close_time, is_open)
    VALUES 
        (v_business_id, 1, '09:00', '18:00', true),
        (v_business_id, 2, '09:00', '18:00', true),
        (v_business_id, 3, '09:00', '18:00', true),
        (v_business_id, 4, '09:00', '18:00', true),
        (v_business_id, 5, '09:00', '18:00', true),
        (v_business_id, 6, '09:00', '18:00', true),
        (v_business_id, 0, '09:00', '18:00', false);

    -- 6. Patronun İlk Personel Olarak Atanması
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

    -- 7. Audit Log (Fixed Column Names for Sprint 1 Security Audit Schema)
    INSERT INTO public.audit_logs (
        business_id, 
        changed_by, 
        action, 
        table_name, 
        record_id,
        action_type
    ) VALUES (
        v_business_id, 
        auth.uid(), 
        'created', 
        'businesses', 
        v_business_id,
        'INSERT'
    );

    RETURN v_business_id;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Onboarding başarısız oldu: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
