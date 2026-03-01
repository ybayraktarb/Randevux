-- ============================================================
-- Sprint 7 - Schema ve RLS Güncellemeleri
-- ============================================================
-- Bu dosyayı Supabase Dashboard → SQL Editor'da çalıştırın.

-- ────────────────────────────────────────────────────────────
-- 1. BUSINESS CUSTOMERS (Müşteriler) TABLOSU GÜNCELLEMELERİ
-- ────────────────────────────────────────────────────────────
-- Müşteri bilgilerini doğrudan bu tabloda tutmak için yeni kolonlar.
-- Kayıtsız (guest) müşteriler için user_id zorunluluğu kaldırıldı.
ALTER TABLE business_customers
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ────────────────────────────────────────────────────────────
-- 2. APPOINTMENTS (Randevular) TABLOSU GÜNCELLEMELERİ
-- ────────────────────────────────────────────────────────────
-- Randevuya ait hizmet (service_id) ve sektörel metadata.
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ────────────────────────────────────────────────────────────
-- 3. STATUS CONSTRAINT DEĞİŞİKLİĞİ (TÜRKÇE DESTEĞİ)
-- ────────────────────────────────────────────────────────────
-- Eski constraint'i kaldırıp Türkçe statülerle yeni check ekliyoruz.
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('Bekliyor', 'Onaylandı', 'Tamamlandı', 'İptal', 'Gelmedi'));

-- Varsayılan statüyü Türkçe yapalım
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'Bekliyor';

-- Eski (İngilizce) datalar varsa onları da Türkçeye çevirmek iyi olabilir:
UPDATE appointments SET status = 'Bekliyor' WHERE status = 'pending';
UPDATE appointments SET status = 'Onaylandı' WHERE status = 'confirmed';
UPDATE appointments SET status = 'Tamamlandı' WHERE status = 'completed';
UPDATE appointments SET status = 'İptal' WHERE status = 'cancelled';
UPDATE appointments SET status = 'Gelmedi' WHERE status = 'no_show';


-- ────────────────────────────────────────────────────────────
-- 4. RLS (ROW LEVEL SECURITY) POLİTİKALARI KONTROLÜ
-- ────────────────────────────────────────────────────────────
-- İşletme (business_id) sadece kendi müşterilerini ve randevularını 
-- görebilmesi, silebilmesi ve güncelleyebilmesi için gerekli politikalar
-- (Mevcut güvenliği doğrulamak adına CREATE OR REPLACE / DROP POLICY 
-- mantığıyla tekrar oluşturulmuştur.)

-- BUSINESS CUSTOMERS RLS
DROP POLICY IF EXISTS "bc_select_owner" ON business_customers;
CREATE POLICY "bc_select_owner"
  ON business_customers FOR SELECT
  USING (is_business_owner(business_id));

DROP POLICY IF EXISTS "bc_insert_self_or_owner" ON business_customers;
CREATE POLICY "bc_insert_self_or_owner"
  ON business_customers FOR INSERT
  WITH CHECK (
    (user_id IS NOT NULL AND auth.uid() = user_id) 
    OR is_business_owner(business_id)
  );

DROP POLICY IF EXISTS "bc_update_owner" ON business_customers;
CREATE POLICY "bc_update_owner"
  ON business_customers FOR UPDATE
  USING (is_business_owner(business_id));

DROP POLICY IF EXISTS "bc_delete_owner" ON business_customers;
CREATE POLICY "bc_delete_owner"
  ON business_customers FOR DELETE
  USING (is_business_owner(business_id));

-- APPOINTMENTS RLS
DROP POLICY IF EXISTS "appointments_select_owner" ON appointments;
CREATE POLICY "appointments_select_owner"
  ON appointments FOR SELECT
  USING (is_business_owner(business_id));

DROP POLICY IF EXISTS "appointments_insert_owner" ON appointments;
CREATE POLICY "appointments_insert_owner"
  ON appointments FOR INSERT
  WITH CHECK (is_business_owner(business_id));

DROP POLICY IF EXISTS "appointments_update_owner" ON appointments;
CREATE POLICY "appointments_update_owner"
  ON appointments FOR UPDATE
  USING (is_business_owner(business_id));

DROP POLICY IF EXISTS "appointments_delete_owner" ON appointments;
CREATE POLICY "appointments_delete_owner"
  ON appointments FOR DELETE
  USING (is_business_owner(business_id));

-- ====== MIGRATION SONU ======
