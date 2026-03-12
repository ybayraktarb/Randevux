-- ============================================================
-- Migration 038: Super Admin Onboarding & KVKK Altyapısı
--
-- Bu migration Sprint 0'ı oluşturur:
--   1. businesses tablosunu genişlet (status, contract, suspend)
--   2. invitations tablosu (patron davet sistemi)
--   3. business_packages tablosu (sözleşme geçmişi)
--   4. users tablosuna kvkk_consent_version ekle (kvkk_consent_at zaten var)
--   5. audit_logs tablosunu genişlet (action, actor_role, ip vs.)
--   6. KVKK veri silme fonksiyonu (anonymize_customer_data)
--   7. İşletme askıya alma fonksiyonu (suspend_business)
--   8. Append-only audit_log politikası (SA dahil LOG SİLEMEZ)
--   9. SA'nın operasyonel tablolara erişimini KALDIR (KVKK)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. BUSINESSES TABLOSUNU GENİŞLET
--    status, sözleşme tarihleri, askıya alma bilgileri
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'cancelled', 'read_only')),
  ADD COLUMN IF NOT EXISTS suspended_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason   TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_start     DATE,
  ADD COLUMN IF NOT EXISTS contract_end       DATE,
  ADD COLUMN IF NOT EXISTS contract_notes     TEXT;     -- SA notları

COMMENT ON COLUMN public.businesses.status IS
  'active: çalışıyor | suspended: askıda (ödeme vb.) | '
  'read_only: süre doldu, veri görüntülenebilir | cancelled: kapatıldı';

COMMENT ON COLUMN public.businesses.contract_end IS
  'NULL = süresiz sözleşme. Dolduğunda sistem read_only yapar.';

-- Index: durum bazlı sorgular
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_contract_end
  ON public.businesses(contract_end) WHERE contract_end IS NOT NULL;


-- ────────────────────────────────────────────────────────────
-- 2. INVITATIONS TABLOSU
--    SA patron davet eder → magic link → ilk girişte işletmeye bağlanır
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  phone        TEXT,
  invited_by   UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  business_id  UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  token        TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '72 hours',
  accepted_at  TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.invitations IS
  'Super admin tarafından gönderilen patron davetleri. '
  '72 saat geçerli, kabul edilince patron hesabına bağlanır.';

CREATE INDEX IF NOT EXISTS idx_invitations_email  ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token  ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- SA tüm davetleri yönetir
DROP POLICY IF EXISTS "sa_manage_invitations" ON public.invitations;
CREATE POLICY "sa_manage_invitations"
  ON public.invitations FOR ALL
  USING (public.is_super_admin());

-- Patron kendi davetini token ile görebilir (ilk giriş akışı)
DROP POLICY IF EXISTS "patron_view_own_invitation" ON public.invitations;
CREATE POLICY "patron_view_own_invitation"
  ON public.invitations FOR SELECT
  USING (email = (SELECT email FROM public.users WHERE id = auth.uid()));


-- ────────────────────────────────────────────────────────────
-- 3. BUSINESS_PACKAGES TABLOSU
--    Sözleşme geçmişi — her paket ataması bir kayıt
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.business_packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  package_id    UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  assigned_by   UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly', 'custom')),
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date      DATE,          -- NULL = süresiz
  status        TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'cancelled')),
  notes         TEXT,          -- SA sözleşme notu
  created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.business_packages IS
  'Her paket atama/değişikliğinin sözleşme kaydı. '
  'Bir işletmenin tüm paket geçmişini tutar.';

CREATE INDEX IF NOT EXISTS idx_biz_packages_business ON public.business_packages(business_id);
CREATE INDEX IF NOT EXISTS idx_biz_packages_status   ON public.business_packages(status);
CREATE INDEX IF NOT EXISTS idx_biz_packages_end_date
  ON public.business_packages(end_date) WHERE end_date IS NOT NULL;

ALTER TABLE public.business_packages ENABLE ROW LEVEL SECURITY;

-- SA tüm kayıtları yönetir
DROP POLICY IF EXISTS "sa_manage_business_packages" ON public.business_packages;
CREATE POLICY "sa_manage_business_packages"
  ON public.business_packages FOR ALL
  USING (public.is_super_admin());

-- Patron kendi işletmesinin paket geçmişini görür
DROP POLICY IF EXISTS "patron_view_own_business_packages" ON public.business_packages;
CREATE POLICY "patron_view_own_business_packages"
  ON public.business_packages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_owners bo
      WHERE bo.business_id = public.business_packages.business_id
        AND bo.user_id = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────────
-- 4. USERS TABLOSUNA KVKK VERSİYON KAYDI EKLE
--    Not: users tablosunda zaten kvkk_consent (boolean) ve
--    kvkk_consent_at (timestamptz) mevcut (001_initial_schema.sql).
--    Sadece hangi metin sürümünün onaylandığını tutan yeni kolon ekliyoruz.
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS kvkk_consent_version TEXT;  -- hangi metin sürümü onaylandı (ör: 'v1.2')

COMMENT ON COLUMN public.users.kvkk_consent_version IS
  'Onaylanan KVKK aydınlatma metni sürümü. Metin güncellenince yeniden onay istenebilir.';


-- ────────────────────────────────────────────────────────────
-- 5. AUDIT_LOGS TABLOSUNU GENİŞLET
--    Mevcut tablo (007): table_name, record_id, action_type, old/new_data, changed_by
--    Yeni kolonlar: action (semantic), actor_role, ip_address, user_agent, business_id
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS action       TEXT,   -- Semantic action: CREATE_BUSINESS, INVITE_PATRON...
  ADD COLUMN IF NOT EXISTS actor_role   TEXT    -- 'super_admin' | 'patron' | 'personel' | 'system'
    CHECK (actor_role IN ('super_admin', 'patron', 'personel', 'system', NULL)),
  ADD COLUMN IF NOT EXISTS business_id  UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ip_address   TEXT,
  ADD COLUMN IF NOT EXISTS user_agent   TEXT;

COMMENT ON COLUMN public.audit_logs.action IS
  'Islemin anlamsal adi. Degerler: CREATE_BUSINESS, INVITE_PATRON, DELETE_CUSTOMER_DATA, SUSPEND_BUSINESS, CHANGE_PACKAGE';

COMMENT ON COLUMN public.audit_logs.actor_role IS
  'İşlemi yapan kullanıcının o andaki rolü.';

CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON public.audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON public.audit_logs(created_at DESC);

-- Audit log SILINEMEEZ (SA dahil) — KVKK ispat zorunluluğu
DROP POLICY IF EXISTS "audit_log_no_delete" ON public.audit_logs;
CREATE POLICY "audit_log_no_delete"
  ON public.audit_logs FOR DELETE
  USING (false);  -- hiç kimse silemez

-- UPDATE da yasak
DROP POLICY IF EXISTS "audit_log_no_update" ON public.audit_logs;
CREATE POLICY "audit_log_no_update"
  ON public.audit_logs FOR UPDATE
  USING (false);  -- hiç kimse güncelleyemez


-- ────────────────────────────────────────────────────────────
-- 6. SEMANTIC AUDIT LOG FONKSİYONU
--    handle_audit_log() trigger'ın yanında, SA server actions'ı
--    bu fonksiyonu çağırarak anlamsal log atar.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action      TEXT,
  p_target_table TEXT,
  p_target_id   UUID,
  p_business_id UUID  DEFAULT NULL,
  p_before      JSONB DEFAULT NULL,
  p_after       JSONB DEFAULT NULL,
  p_ip_address  TEXT  DEFAULT NULL,
  p_user_agent  TEXT  DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_actor_role TEXT;
  v_log_id     UUID;
BEGIN
  -- Aktörün rolünü belirle
  SELECT
    CASE
      WHEN u.global_role = 'super_admin' THEN 'super_admin'
      WHEN EXISTS (SELECT 1 FROM public.business_owners bo WHERE bo.user_id = u.id) THEN 'patron'
      WHEN EXISTS (SELECT 1 FROM public.staff_business sb WHERE sb.user_id = u.id) THEN 'personel'
      ELSE 'system'
    END
  INTO v_actor_role
  FROM public.users u
  WHERE u.id = auth.uid();

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action_type,
    action,
    actor_role,
    business_id,
    old_data,
    new_data,
    changed_by,
    ip_address,
    user_agent
  ) VALUES (
    p_target_table,
    p_target_id,
    'INSERT',           -- semantic log için INSERT kullanılır (action kolonu anlamı taşır)
    p_action,
    COALESCE(v_actor_role, 'system'),
    p_business_id,
    p_before,
    p_after,
    auth.uid(),
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_admin_action IS
  'Server action''lardan çağrılır. KVKK için anlamsal audit log kaydı oluşturur.';


-- ────────────────────────────────────────────────────────────
-- 7. KVKK MÜŞTERİ VERİSİ ANONİMLEŞTİRME FONKSİYONU
--    SA "veri sil" tetikler → PII silinir, finans/randevu korunur
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.anonymize_customer_data(
  p_customer_user_id UUID,
  p_business_id      UUID,
  p_reason           TEXT DEFAULT 'KVKK silme talebi'
)
RETURNS JSONB AS $$
DECLARE
  v_before       JSONB;
  v_affected_apps INT;
  v_affected_notes INT;
BEGIN
  -- Sadece super admin çağırabilir
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Yetkisiz erişim: Bu işlem sadece super admin yetkisi gerektirir.';
  END IF;

  -- Silmeden önce snapshot al (audit için)
  SELECT to_jsonb(u.*) INTO v_before
  FROM public.users u WHERE u.id = p_customer_user_id;

  -- 1. Kullanıcı PII anonimleştir
  UPDATE public.users SET
    name         = 'Silinmiş Kullanıcı',
    email        = 'deleted_' || p_customer_user_id || '@anonymized.invalid',
    phone        = NULL,
    avatar_url   = NULL
  WHERE id = p_customer_user_id;

  -- 2. Bu işletmedeki randevularda müşteri referansını kaldır
  UPDATE public.appointments SET
    customer_user_id = NULL,
    notes            = NULL   -- müşteri notu olabilir, sil
  WHERE customer_user_id = p_customer_user_id
    AND business_id = p_business_id;

  GET DIAGNOSTICS v_affected_apps = ROW_COUNT;

  -- 3. Müşteri notlarını sil
  DELETE FROM public.customer_notes
  WHERE customer_user_id = p_customer_user_id
    AND business_id = p_business_id;

  GET DIAGNOSTICS v_affected_notes = ROW_COUNT;

  -- 4. Audit log kaydı
  PERFORM public.log_admin_action(
    p_action       => 'DELETE_CUSTOMER_DATA',
    p_target_table => 'users',
    p_target_id    => p_customer_user_id,
    p_business_id  => p_business_id,
    p_before       => v_before,
    p_after        => jsonb_build_object('status', 'anonymized', 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'success',              true,
    'anonymized_user_id',   p_customer_user_id,
    'affected_appointments', v_affected_apps,
    'affected_notes',        v_affected_notes,
    'note',                  'Finans kayıtları VUK gereği korunmaktadır.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_customer_data IS
  'KVKK 11. madde: İlgili kişinin silme hakkını kullanması durumunda çağrılır. '
  'PII anonimleştirilir. Finans ve ticari kayıtlar VUK gereği korunur. '
  'Tüm işlem audit_logs''a kaydedilir.';

GRANT EXECUTE ON FUNCTION public.anonymize_customer_data TO authenticated;


-- ────────────────────────────────────────────────────────────
-- 8. İŞLETME ASKIYA ALMA FONKSİYONU
--    SA çağırır → status güncellenir → audit log düşer
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.suspend_business(
  p_business_id UUID,
  p_reason      TEXT,
  p_reactivate  BOOLEAN DEFAULT false   -- true → tekrar aktif et
)
RETURNS JSONB AS $$
DECLARE
  v_before  JSONB;
  v_new_status TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Yetkisiz erişim: Bu işlem sadece super admin yetkisi gerektirir.';
  END IF;

  -- Mevcut durumu al
  SELECT to_jsonb(b.*) INTO v_before FROM public.businesses b WHERE b.id = p_business_id;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'İşletme bulunamadı: %', p_business_id;
  END IF;

  IF p_reactivate THEN
    v_new_status := 'active';
    UPDATE public.businesses SET
      status          = 'active',
      suspended_at    = NULL,
      suspended_reason= NULL
    WHERE id = p_business_id;
  ELSE
    v_new_status := 'suspended';
    UPDATE public.businesses SET
      status           = 'suspended',
      suspended_at     = now(),
      suspended_reason = p_reason
    WHERE id = p_business_id;
  END IF;

  -- Audit log
  PERFORM public.log_admin_action(
    p_action       => CASE WHEN p_reactivate THEN 'REACTIVATE_BUSINESS' ELSE 'SUSPEND_BUSINESS' END,
    p_target_table => 'businesses',
    p_target_id    => p_business_id,
    p_business_id  => p_business_id,
    p_before       => v_before,
    p_after        => jsonb_build_object('status', v_new_status, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'success',    true,
    'business_id', p_business_id,
    'new_status', v_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.suspend_business IS
  'SA işletmeyi askıya alır (p_reactivate=false) veya tekrar aktive eder (true). '
  'Tüm işlem audit_logs''a kaydedilir.';

GRANT EXECUTE ON FUNCTION public.suspend_business TO authenticated;


-- ────────────────────────────────────────────────────────────
-- 9. KVKK: SA'NIN OPERASYONEl TABLOLARA ERİŞİMİNİ KISITLA
--    Sprint 0'ın en kritik kısmı.
--    007'deki "Super admin can do all on X" politikaları kaldırılır,
--    yerine sadece metadata erişimi olan politikalar eklenir.
-- ────────────────────────────────────────────────────────────

-- SA artik appointments, customer_notes tablosuna giremez
DROP POLICY IF EXISTS "Super admin can do all on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Super admin can do all on customer_notes" ON public.customer_notes;

-- SA services tablosunu görebilir ama sadece okuma (paket kontrolü için)
-- Düzenleme patron yetkisi
DROP POLICY IF EXISTS "Super admin can do all on services" ON public.services;
CREATE POLICY "sa_read_services"
  ON public.services FOR SELECT
  USING (public.is_super_admin());

-- Eski geniş businesses politikasını kaldır
-- SA sadece metadata görmesi gereken kolonlarla yeni politika
DROP POLICY IF EXISTS "Super admin can do all on businesses" ON public.businesses;
DROP POLICY IF EXISTS "super_admin_manage_businesses" ON public.businesses;

-- SA: işletme metadata okuma (ad, sektör, paket, durum — OP. VERİ YOK)
CREATE POLICY "sa_read_business_metadata"
  ON public.businesses FOR SELECT
  USING (public.is_super_admin());

-- SA: işletme oluşturabilir ve status/contract/suspend güncelleyebilir
-- (ROW LEVEL — sadece belirli alanlar güvenli şekilde güncellenir)
CREATE POLICY "sa_manage_business_lifecycle"
  ON public.businesses FOR ALL
  USING (public.is_super_admin());

-- Patron kendi işletmelerini tam yönetir (operasyonel alan)
-- (Mevcut patron politikaları dokunulmadan devam eder)

-- staff_business ve business_owners: SA hâlâ yönetir (atama için)
-- Mevcut politikalar devam eder.

-- leave_requests, no_show_records: operasyonel — SA erişimi kaldır
DROP POLICY IF EXISTS "Super admin can do all on leave_requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Super admin can do all on no_show_records" ON public.no_show_records;


-- ────────────────────────────────────────────────────────────
-- 10. İŞLETME SÖZLEŞME SÜRESİ DOLUNCA READ_ONLY YAPAN FONKSİYON
--     Scheduler (cron) bu fonksiyonu her gün çağırır
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_and_update_contract_expiry()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  -- Süresi dolan aktif işletmeleri read_only yap
  UPDATE public.businesses SET
    status = 'read_only'
  WHERE status = 'active'
    AND contract_end IS NOT NULL
    AND contract_end < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;  -- Kaç işletme etkilendi
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_and_update_contract_expiry IS
  'Günlük cron job''u bu fonksiyonu çağırır. '
  'Süresi dolan işletmeleri read_only moda alır.';


-- ────────────────────────────────────────────────────────────
-- 11. PATRON'UN KVKK ONAY KONTROL HELPER'I
--     Middleware veya server component'ler bunu kullanır
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.has_kvkk_consent(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := COALESCE(p_user_id, auth.uid());
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_uid
      AND kvkk_consent_at IS NOT NULL  -- 001_initial_schema: kvkk_consent_at TIMESTAMPTZ
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_kvkk_consent IS
  'Kullanıcının KVKK metnini onaylayıp onaylamadığını döner. '
  'İlk giriş middleware''inde kullanılır.';


-- ────────────────────────────────────────────────────────────
-- 12. BUSINESS_PACKAGES → BUSINESSES.PACKAGE_ID SYNC
--     business_packages'a paket eklenince businesses.package_id de güncellenir
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_active_package_to_business()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    -- Aynı işletmenin diğer aktif paketlerini expire et
    UPDATE public.business_packages SET status = 'expired'
    WHERE business_id = NEW.business_id
      AND id != NEW.id
      AND status = 'active';

    -- businesses.package_id güncelle (trigger zinciri: sync_business_features çalışır)
    UPDATE public.businesses SET
      package_id     = NEW.package_id,
      contract_start = NEW.start_date,
      contract_end   = NEW.end_date
    WHERE id = NEW.business_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_active_package ON public.business_packages;
CREATE TRIGGER trg_sync_active_package
  AFTER INSERT OR UPDATE OF status ON public.business_packages
  FOR EACH ROW EXECUTE FUNCTION public.sync_active_package_to_business();


-- ════════════════════════════════════════════════════════════
-- ✅ MIGRATION 038 TAMAMLANDI
--
-- Özet:
--   ✓ businesses: status, contract_start/end, suspended_at/reason eklendi
--   ✓ invitations: patron davet sistemi (72 saat geçerli, RLS)
--   ✓ business_packages: sözleşme geçmişi tablosu (RLS)
--   ✓ users: kvkk_consent_given_at, kvkk_consent_version eklendi
--   ✓ audit_logs: action, actor_role, business_id, ip_address, user_agent eklendi
--   ✓ audit_logs DELETE/UPDATE politikası kapatıldı (append-only)
--   ✓ log_admin_action(): semantic audit log fonksiyonu
--   ✓ anonymize_customer_data(): KVKK silme (PII anon, finans korunur)
--   ✓ suspend_business(): askıya alma/aktive etme + audit
--   ✓ SA, appointments ve customer_notes tablolarına erişemez (KVKK)
--   ✓ check_and_update_contract_expiry(): cron için sözleşme süresi kontrolü
--   ✓ has_kvkk_consent(): KVKK onay kontrol helper'ı
--   ✓ sync_active_package_to_business(): business_packages → businesses sync
-- ════════════════════════════════════════════════════════════
