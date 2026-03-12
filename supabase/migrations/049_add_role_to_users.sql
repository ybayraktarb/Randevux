-- Migration: 049_add_role_to_users
-- Description: Adds a 'role' column to the public.users table to fix visibility issues in the admin panel.

-- 1. Add the role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN role TEXT DEFAULT 'musteri';
        
        COMMENT ON COLUMN public.users.role IS 'Kullanıcı rolü (patron, personel, musteri, super_admin)';
    END IF;
END $$;

-- 2. Backfill: If a user has a global_role of 'super_admin', set their role to 'super_admin'
UPDATE public.users 
SET role = 'super_admin' 
WHERE global_role = 'super_admin';

-- 3. Backfill: If a user is in business_owners, set their role to 'patron'
-- (Priority: super_admin > patron)
UPDATE public.users 
SET role = 'patron' 
WHERE role != 'super_admin' 
AND id IN (SELECT user_id FROM public.business_owners);

-- 4. Backfill: If a user is in staff_business, set their role to 'personel'
-- (Priority: super_admin > patron > personel)
UPDATE public.users 
SET role = 'personel' 
WHERE role NOT IN ('super_admin', 'patron') 
AND id IN (SELECT user_id FROM public.staff_business);

-- 5. Final check/default: Ensure no nulls (though we set a default)
UPDATE public.users SET role = 'musteri' WHERE role IS NULL;

-- 6. Update create_staff_user_transaction to also set the role in public.users
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
    -- EKLENDI: role = 'personel' (personel ekleme akışı olduğu için)
    INSERT INTO public.users (id, email, name, phone, role, is_active)
    VALUES (p_auth_user_id, p_email, p_name, p_phone, 'personel', true)
    ON CONFLICT (id) DO UPDATE 
    SET 
        email = EXCLUDED.email,
        name = COALESCE(users.name, EXCLUDED.name),
        phone = COALESCE(users.phone, EXCLUDED.phone),
        role = 'personel',
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
