-- Migration: 062_jwt_role_sync
-- Description: Centralizes role resolution and stores it in auth.users.raw_app_meta_data and public.users.role

-- 1. Fonksiyon: Rol Hesaplama ve Eşitleme (public.users & auth.users tablosu ile)
CREATE OR REPLACE FUNCTION public.sync_user_role(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_role TEXT := 'musteri';
    v_app_meta_data JSONB;
BEGIN
    -- Hiyerarşi Kontrolü: super_admin > patron > personel > musteri
    IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id AND global_role = 'super_admin') THEN
        v_role := 'super_admin';
    ELSIF EXISTS (SELECT 1 FROM public.business_owners WHERE user_id = p_user_id) THEN
        v_role := 'patron';
    ELSIF EXISTS (SELECT 1 FROM public.staff_business WHERE user_id = p_user_id AND is_active = true) THEN
        v_role := 'personel';
    END IF;

    -- 1. Sync public.users.role (Sadece eksik veya yanlışsa güncelle, döngüleri engeller)
    UPDATE public.users 
    SET role = v_role 
    WHERE id = p_user_id AND (role IS NULL OR role != v_role);

    -- 2. Sync JWT app_metadata -> role
    SELECT raw_app_meta_data INTO v_app_meta_data
    FROM auth.users 
    WHERE id = p_user_id;

    IF v_app_meta_data IS NULL THEN
        v_app_meta_data := '{}'::jsonb;
    END IF;

    -- Eğer jwt field yoksa ya da içindeki rol v_role değilse update at
    IF NOT (v_app_meta_data ? 'role') OR (v_app_meta_data->>'role' != v_role) THEN
        UPDATE auth.users
        SET raw_app_meta_data = jsonb_set(v_app_meta_data, '{role}', to_jsonb(v_role))
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Genel Trigger Fonksiyonu (Dinamik Tablo Tanıma)
CREATE OR REPLACE FUNCTION public.trg_sync_role()
RETURNS TRIGGER AS $$
DECLARE
    v_target_user_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_target_user_id := OLD.user_id;
    ELSIF TG_TABLE_NAME = 'users' THEN
        v_target_user_id := NEW.id;
    ELSE
        v_target_user_id := NEW.user_id;
    END IF;

    -- Sync servisini uyar
    PERFORM public.sync_user_role(v_target_user_id);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Trigger Bağlantıları (3 Farklı Senaryo)

-- A. users tablosunda global_role degisirse
DROP TRIGGER IF EXISTS trg_users_global_role_sync ON public.users;
CREATE TRIGGER trg_users_global_role_sync
AFTER UPDATE OF global_role ON public.users
FOR EACH ROW
WHEN (OLD.global_role IS DISTINCT FROM NEW.global_role)
EXECUTE FUNCTION public.trg_sync_role();

-- B. business_owners (Patron eklendiğinde veya silindiğinde)
DROP TRIGGER IF EXISTS trg_business_owners_role_sync ON public.business_owners;
CREATE TRIGGER trg_business_owners_role_sync
AFTER INSERT OR DELETE ON public.business_owners
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_role();

-- C. staff_business (Personel eklendiğinde, yetkisi açılıp kapandığında, veya silindiğinde)
DROP TRIGGER IF EXISTS trg_staff_business_role_sync ON public.staff_business;
CREATE TRIGGER trg_staff_business_role_sync
AFTER INSERT OR UPDATE OF is_active OR DELETE ON public.staff_business
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_role();


-- 4. Initial Backfill: Mevcut tüm hesaplar için bir seferliğine rol hesaplamayı (JWT Basımını) tetikle.
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id FROM public.users LOOP
        PERFORM public.sync_user_role(u.id);
    END LOOP;
END;
$$;
