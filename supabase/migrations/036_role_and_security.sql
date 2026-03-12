-- ============================================================
-- Migration 036: Role System & Security Hardening
--
-- Değişiklikler:
--   1. users.global_role kolonu ekle (super_admin | user)
--   2. super_admins → users.global_role senkronize eden trigger
--   3. lib/supabase/roles.ts için performans iyileştirmesi (DB tarafı)
--   4. RLS policy'leri global_role bazlı güncelle (subquery yerine kolon)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. USERS TABLOSUNA GLOBAL_ROLE EKLE
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS global_role TEXT NOT NULL DEFAULT 'user'
    CHECK (global_role IN ('super_admin', 'user'));

COMMENT ON COLUMN public.users.global_role IS
  'Platform genelinde rol. super_admin: tüm işletmelere tam erişim. '
  'user: işletme context''ine göre patron/personel/müşteri olabilir.';

-- Index: getUserRole fonksiyonu bu kolonu okuyacak
CREATE INDEX IF NOT EXISTS idx_users_global_role
  ON public.users(global_role) WHERE global_role = 'super_admin';


-- ────────────────────────────────────────────────────────────
-- 2. MEVCUT SUPER ADMIN'LERİ MIGRATE ET
--    super_admins tablosundaki kayıtları global_role'a yaz
-- ────────────────────────────────────────────────────────────

UPDATE public.users u
SET global_role = 'super_admin'
WHERE EXISTS (
  SELECT 1 FROM public.super_admins sa WHERE sa.user_id = u.id
);


-- ────────────────────────────────────────────────────────────
-- 3. SUPER ADMINS ↔ USERS.GLOBAL_ROLE SYNC TRİGGERLAR
--    İki tablo tutarlı kalsın. super_admins INSERT → global_role güncelle
--    super_admins DELETE → global_role 'user'e çek
-- ────────────────────────────────────────────────────────────

-- Trigger fonksiyonu: super_admins INSERT/DELETE → users.global_role güncelle
CREATE OR REPLACE FUNCTION public.sync_global_role_on_super_admin_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET global_role = 'super_admin' WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.users SET global_role = 'user' WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_global_role_on_sa_insert ON public.super_admins;
CREATE TRIGGER trg_sync_global_role_on_sa_insert
  AFTER INSERT ON public.super_admins
  FOR EACH ROW EXECUTE FUNCTION public.sync_global_role_on_super_admin_change();

DROP TRIGGER IF EXISTS trg_sync_global_role_on_sa_delete ON public.super_admins;
CREATE TRIGGER trg_sync_global_role_on_sa_delete
  AFTER DELETE ON public.super_admins
  FOR EACH ROW EXECUTE FUNCTION public.sync_global_role_on_super_admin_change();

-- Ters trigger: users.global_role SET super_admin → super_admins'e ekle
CREATE OR REPLACE FUNCTION public.sync_super_admins_on_global_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.global_role = 'super_admin' AND OLD.global_role != 'super_admin' THEN
    INSERT INTO public.super_admins (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  IF NEW.global_role = 'user' AND OLD.global_role = 'super_admin' THEN
    DELETE FROM public.super_admins WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_super_admins_on_role_change ON public.users;
CREATE TRIGGER trg_sync_super_admins_on_role_change
  AFTER UPDATE OF global_role ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_super_admins_on_global_role_change();


-- ────────────────────────────────────────────────────────────
-- 4. RLS HELPER FONKSİYONU — Super Admin Kontrolü
--    Subquery yerine tek kolon okuma: çok daha hızlı
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND global_role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_super_admin IS
  'Mevcut kullanıcının super_admin olup olmadığını kontrol eder. '
  'RLS policy''lerinde EXISTS(SELECT 1 FROM super_admins) yerine kullanın.';


-- ────────────────────────────────────────────────────────────
-- 5. USERS TABLOSU RLS — Super Admin tüm kullanıcıları yönetebilir
-- ────────────────────────────────────────────────────────────

-- Mevcut politikaları koru, super admin için genişlet
DROP POLICY IF EXISTS "super_admin_manage_users" ON public.users;
CREATE POLICY "super_admin_manage_users"
  ON public.users FOR ALL
  USING (public.is_super_admin());

-- Super admin kendi profilini de görebilmeli (zaten var, ama global_role için)
DROP POLICY IF EXISTS "Users can update own global_role protection" ON public.users;
-- NOT: global_role'u normal kullanıcı değiştiremez (sadece super_admin veya trigger)
-- Bu RLS policy ile değil, uygulama katmanında korunuyor (server action).


-- ────────────────────────────────────────────────────────────
-- 6. MEVCUT FEATURE/PACKAGE RLS'LERİNİ is_super_admin() KULLANACAK ŞEKİLDE GÜNCELLE
--    Performans: subquery yerine fonksiyon
-- ────────────────────────────────────────────────────────────

-- features
DROP POLICY IF EXISTS "super_admin_manage_features" ON public.features;
CREATE POLICY "super_admin_manage_features" ON public.features
  FOR ALL USING (public.is_super_admin());

-- business_features
DROP POLICY IF EXISTS "super_admin_manage_business_features" ON public.business_features;
CREATE POLICY "super_admin_manage_business_features" ON public.business_features
  FOR ALL USING (public.is_super_admin());

-- packages
DROP POLICY IF EXISTS "super_admin_manage_packages" ON public.packages;
CREATE POLICY "super_admin_manage_packages" ON public.packages
  FOR ALL USING (public.is_super_admin());

-- package_features
DROP POLICY IF EXISTS "super_admin_manage_package_features" ON public.package_features;
CREATE POLICY "super_admin_manage_package_features" ON public.package_features
  FOR ALL USING (public.is_super_admin());

-- sector_default_features (migration 035'te oluşturuldu)
DROP POLICY IF EXISTS "super_admin_manage_sector_defaults" ON public.sector_default_features;
CREATE POLICY "super_admin_manage_sector_defaults"
  ON public.sector_default_features FOR ALL
  USING (public.is_super_admin());

-- business_features — patron kendi işletmesinin özelliklerini görebilir
DROP POLICY IF EXISTS "business_features_owner_read" ON public.business_features;
CREATE POLICY "business_features_owner_read" ON public.business_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_owners bo
      WHERE bo.business_id = public.business_features.business_id
        AND bo.user_id = auth.uid()
    )
    OR public.is_super_admin()
  );


-- ────────────────────────────────────────────────────────────
-- 7. CHECK_FEATURE_ACCESS FONKSİYONUNU GÜNCELLE
--    Super admin her zaman erişebilir (paket olmadan bile)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_feature_access(p_business_id UUID, p_feature_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin her özelliğe erişebilir
  IF public.is_super_admin() THEN RETURN true; END IF;

  -- İşletmenin aktif özellik listesinde mi?
  RETURN EXISTS (
    SELECT 1
    FROM public.business_features bf
    JOIN public.features f ON f.id = bf.feature_id
    WHERE bf.business_id = p_business_id
      AND f.key = p_feature_key
      AND bf.is_enabled = true
      AND (bf.valid_until IS NULL OR bf.valid_until > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ════════════════════════════════════════════════════════════
-- ✅ MIGRATION 036 TAMAMLANDI
--
-- Özet:
--   ✓ users.global_role eklendi (super_admin | user)
--   ✓ Mevcut super admin'ler migrate edildi
--   ✓ Çift yönlü sync trigger (super_admins ↔ users.global_role)
--   ✓ is_super_admin() helper fonksiyonu eklendi
--   ✓ Tüm super admin RLS policy'leri is_super_admin() kullanıyor
--   ✓ check_feature_access super admin'e bypass eklendi
-- ════════════════════════════════════════════════════════════
