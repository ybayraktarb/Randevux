-- Migration: 031_staff_visual_identity
-- Description: Adds expertise level and calendar color for staff members.

-- 1. Add columns to staff_business
ALTER TABLE public.staff_business 
ADD COLUMN IF NOT EXISTS expertise_level TEXT DEFAULT 'Mid-Level',
ADD COLUMN IF NOT EXISTS calendar_color TEXT DEFAULT '#3b82f6';

-- 2. Update the transactional RPC to include these fields
CREATE OR REPLACE FUNCTION public.create_staff_user_transaction(
    p_auth_user_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_business_id UUID,
    p_role TEXT,
    p_expertise_level TEXT DEFAULT 'Mid-Level',
    p_calendar_color TEXT DEFAULT '#3b82f6'
)
RETURNS JSONB AS $$
DECLARE
    v_new_staff_business_id UUID;
BEGIN
    -- 1. ADIM: public.users tablosuna profili ekle/güncelle
    INSERT INTO public.users (id, email, name, phone, is_active)
    VALUES (p_auth_user_id, p_email, p_name, p_phone, true)
    ON CONFLICT (id) DO UPDATE 
    SET 
        email = EXCLUDED.email,
        name = COALESCE(users.name, EXCLUDED.name),
        phone = COALESCE(users.phone, EXCLUDED.phone),
        is_active = EXCLUDED.is_active;

    -- 2. ADIM: staff_business tablosuna personeli bağla
    INSERT INTO public.staff_business (
        user_id, 
        business_id, 
        role, 
        is_active, 
        can_set_own_price, 
        can_set_own_duration,
        expertise_level,
        calendar_color
    )
    VALUES (
        p_auth_user_id,
        p_business_id,
        p_role,
        true,
        false,
        false,
        p_expertise_level,
        p_calendar_color
    )
    RETURNING id INTO v_new_staff_business_id;

    -- Başarılı dönüş
    RETURN jsonb_build_object(
        'success', true,
        'staff_business_id', v_new_staff_business_id
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Bu kullanıcı zaten işletmenizde kayıtlı.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Veritabanı hatası: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
