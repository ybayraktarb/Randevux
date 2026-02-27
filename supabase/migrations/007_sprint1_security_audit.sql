-- ============================================================
-- RandevuX — Sprint 1: Güvenlik, Veri Bütünlüğü ve Altyapı
-- Version: 1.0.1
-- Date: 2024-02-27
-- Description: Super Admin RLS, Audit Logs ve FK Cascade
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. YARDIMCI GÜVENLİK FONKSİYONLARI (GÜNCELLEME GEREKMEZ)
-- 002_complete_rls'de tanımlanan is_super_admin() mevcuttur.
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- GÖREV 1: SÜPER ADMİN RLS KURALLARI
-- ────────────────────────────────────────────────────────────

-- Users: Super Admin her profili yönetebilir
CREATE POLICY "Super admin can do all on users"
  ON users FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Businesses: Super Admin tüm işletmeleri yönetebilir
CREATE POLICY "Super admin can do all on businesses"
  ON businesses FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Services: Super Admin tüm servisleri yönetebilir
CREATE POLICY "Super admin can do all on services"
  ON services FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Appointments: Super Admin tüm randevuları yönetebilir
CREATE POLICY "Super admin can do all on appointments"
  ON appointments FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Business Owners: Super Admin patronları atayabilir/çıkarabilir
CREATE POLICY "Super admin can do all on business_owners"
  ON business_owners FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Staff Business: Super Admin personelleri yönetebilir
CREATE POLICY "Super admin can do all on staff_business"
  ON staff_business FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Customer Notes: Super Admin müşteri notlarına tam erişebilir
CREATE POLICY "Super admin can do all on customer_notes"
  ON customer_notes FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- No Show Records: Super Admin no-show kayıtlarını görebilir/yönetebilir
CREATE POLICY "Super admin can do all on no_show_records"
  ON no_show_records FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Leave Requests: Super Admin izin isteklerini yönetebilir
CREATE POLICY "Super admin can do all on leave_requests"
  ON leave_requests FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());


-- ────────────────────────────────────────────────────────────
-- GÖREV 2: AUDIT LOGS (SİSTEM LOGLARI) OTOMASYONU
-- ────────────────────────────────────────────────────────────

-- Eski audit log tablosunu yedekle/sil ve yeniden doğru şema ile oluştur
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID, -- auth.users.id referansı, trigger tarafından doldurulacak
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index'leri oluştur
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);

-- Audit Log RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Super Admin logları görebilir
CREATE POLICY "audit_select_super_admin"
  ON audit_logs FOR SELECT
  USING (is_super_admin());

-- Uygulamanın log girmesine (manuel) de izin vermek gerekirse (Trigger bypass eder)
CREATE POLICY "audit_insert_authenticated"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- Otomatik Audit Log Trigger Fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_record_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_record_id := OLD.id;
    END IF;

    INSERT INTO audit_logs (
        table_name, 
        record_id, 
        action_type, 
        old_data, 
        new_data, 
        changed_by
    ) VALUES (
        TG_TABLE_NAME, 
        v_record_id, 
        TG_OP, 
        v_old_data, 
        v_new_data, 
        auth.uid()
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggerları ana tablolara bağla
CREATE TRIGGER audit_businesses_changes
AFTER INSERT OR UPDATE OR DELETE ON businesses
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_appointments_changes
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_users_changes
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- ────────────────────────────────────────────────────────────
-- GÖREV 3: FOREIGN KEY RİSKLERİ VE VERİ BÜTÜNLÜĞÜ
-- ────────────────────────────────────────────────────────────

-- 3.1 Appointments -> Businesses Bağımsızlığı (Restrict)
-- Bir işletme yanlışlıkla silinmeye çalışılırsa ve randevuları varsa silinmeyi ENGELLER
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_business_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE RESTRICT;

-- 3.2 Appointments -> Users (Customer) Bağımsızlığı (Set Null)
-- Bir müşteri silinirse (GDPR vs.), ticari kayıtlar için randevu silinmez, sahibi NULL olur.
-- Önce customer_user_id nullable yapılmalı
ALTER TABLE appointments ALTER COLUMN customer_user_id DROP NOT NULL;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_customer_user_id_fkey;
ALTER TABLE appointments ADD CONSTRAINT appointments_customer_user_id_fkey
    FOREIGN KEY (customer_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3.3 Business Owners -> Businesses (Cascade devam eder ama explicitly tanımlayalım)
-- İşletme kapanırsa sahiplik kayıtları da kalkar. 
ALTER TABLE business_owners DROP CONSTRAINT IF EXISTS business_owners_business_id_fkey;
ALTER TABLE business_owners ADD CONSTRAINT business_owners_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- 3.4 Staff Business -> Businesses (Cascade)
-- İşletme kapanırsa personellerin oradaki kayıtları da kalkar.
ALTER TABLE staff_business DROP CONSTRAINT IF EXISTS staff_business_business_id_fkey;
ALTER TABLE staff_business ADD CONSTRAINT staff_business_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- 3.5 Services -> Businesses (Cascade)
-- İşletme kapanırsa o işletmeye ait servisler ve fiyatlar da kalkar.
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_business_id_fkey;
ALTER TABLE services ADD CONSTRAINT services_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- ============================================================
-- ✅ SPRINT 1 MIGRATION SUCCESSFUL
-- ============================================================
