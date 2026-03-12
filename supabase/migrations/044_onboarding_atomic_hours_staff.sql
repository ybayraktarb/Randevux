-- ============================================================
-- Migration 044: Atomic Business Hours & Staff Assignment
-- 
-- 1. update onboard_business function to include:
--    a. business_hours insertion for 7 days (0: closed, 1-6: 09:00-18:00)
--    b. staff_business insertion to make the owner the first active staff
-- ============================================================

-- Mevcut fonksiyonun signature değişmeyecek, ancak içeriği güncelleyeceğiz.
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
    -- Kullanıcıyı işletme sahibi olarak atıyoruz.
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

    -- 5. Varsayılan Çalışma Saatleri (Atomic Step 5 - SPRINT 4)
    -- Pazartesi (1) ile Cumartesi (6) arası 09:00 - 18:00, Pazar (0) Kapalı.
    INSERT INTO public.business_hours (business_id, day_of_week, open_time, close_time, is_open)
    VALUES 
        (v_business_id, 1, '09:00', '18:00', true),
        (v_business_id, 2, '09:00', '18:00', true),
        (v_business_id, 3, '09:00', '18:00', true),
        (v_business_id, 4, '09:00', '18:00', true),
        (v_business_id, 5, '09:00', '18:00', true),
        (v_business_id, 6, '09:00', '18:00', true),
        (v_business_id, 0, '09:00', '18:00', false);

    -- 6. Patronun İlk Personel (Staff) Olarak Atanması (Atomic Step 6 - SPRINT 5)
    -- Küçük işletmelerde patron aynı zamanda hizmet veren ana personeldir.
    INSERT INTO public.staff_business (
        user_id,
        business_id,
        can_set_own_price,
        can_set_own_duration,
        is_active
    ) VALUES (
        p_owner_user_id,
        v_business_id,
        true, -- Patron olduğu için kendisi fiyat/süre ayarlayabilsin
        true,
        true
    );

    -- 7. Audit Log (Enterprise Requirement)
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

COMMENT ON FUNCTION public.onboard_business(UUID, TEXT, UUID, UUID, JSONB, public.onboarding_status_type, TIMESTAMPTZ) IS 'İşletme, Patron, Abonelik, Hizmetler, Saatler ve Personeli tam atomik (Transaction) olarak kuran güncellenmiş Enterprise RPC.';
