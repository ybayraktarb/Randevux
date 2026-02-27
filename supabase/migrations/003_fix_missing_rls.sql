-- ============================================================
-- RandevuX — Eksik RLS Politikaları (Migration 003)
-- ============================================================
-- Bu migration, 001 ve 002'de eksik kalan RLS politikalarını
-- tamamlar. Mevcut politikalara dokunmaz.
-- Idempotent: DROP POLICY IF EXISTS + CREATE POLICY kullanır.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. BUSINESS_CUSTOMERS (RLS tamamen yoktu)
-- ════════════════════════════════════════════════════════════

-- Önce RLS'yi etkinleştir
ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;

-- Patron kendi işletmesinin müşterilerini görebilir
DROP POLICY IF EXISTS "bc_select_owner" ON business_customers;
CREATE POLICY "bc_select_owner"
  ON business_customers FOR SELECT
  USING (is_business_owner(business_id));

-- Staff kendi işletmesinin müşterilerini görebilir
DROP POLICY IF EXISTS "bc_select_staff" ON business_customers;
CREATE POLICY "bc_select_staff"
  ON business_customers FOR SELECT
  USING (is_staff_of(business_id));

-- Kullanıcı kendi müşteri kaydını görebilir
DROP POLICY IF EXISTS "bc_select_self" ON business_customers;
CREATE POLICY "bc_select_self"
  ON business_customers FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcı kendini müşteri yapabilir VEYA patron ekleyebilir
DROP POLICY IF EXISTS "bc_insert_self_or_owner" ON business_customers;
CREATE POLICY "bc_insert_self_or_owner"
  ON business_customers FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_business_owner(business_id));

-- Patron güncelleme yapabilir (is_blocked vb.)
DROP POLICY IF EXISTS "bc_update_owner" ON business_customers;
CREATE POLICY "bc_update_owner"
  ON business_customers FOR UPDATE
  USING (is_business_owner(business_id));

-- Patron müşteri kaydını silebilir
DROP POLICY IF EXISTS "bc_delete_owner" ON business_customers;
CREATE POLICY "bc_delete_owner"
  ON business_customers FOR DELETE
  USING (is_business_owner(business_id));


-- ════════════════════════════════════════════════════════════
-- 2. STAFF_BUSINESS (mevcut SELECT var, CRUD eksik)
-- ════════════════════════════════════════════════════════════
-- NOT: 001_initial_schema.sql'de zaten şu politika var:
--   "Staff can view own records" → USING (auth.uid() = user_id)
-- Burada sadece eksik olanları ekliyoruz.

-- Patron kendi işletmesinin personelini görebilir
DROP POLICY IF EXISTS "sb_select_owner" ON staff_business;
CREATE POLICY "sb_select_owner"
  ON staff_business FOR SELECT
  USING (is_business_owner(business_id));

-- Patron personel ekleyebilir
DROP POLICY IF EXISTS "sb_insert_owner" ON staff_business;
CREATE POLICY "sb_insert_owner"
  ON staff_business FOR INSERT
  WITH CHECK (is_business_owner(business_id));

-- Patron personel kaydını güncelleyebilir
DROP POLICY IF EXISTS "sb_update_owner" ON staff_business;
CREATE POLICY "sb_update_owner"
  ON staff_business FOR UPDATE
  USING (is_business_owner(business_id));

-- Patron personel kaydını silebilir
DROP POLICY IF EXISTS "sb_delete_owner" ON staff_business;
CREATE POLICY "sb_delete_owner"
  ON staff_business FOR DELETE
  USING (is_business_owner(business_id));


-- ════════════════════════════════════════════════════════════
-- 3. NOTIFICATIONS (INSERT ve DELETE eksik)
-- ════════════════════════════════════════════════════════════
-- NOT: 001_initial_schema.sql'de zaten şu politikalar var:
--   "Users see own notifications"   → SELECT → auth.uid() = user_id
--   "Users update own notifications" → UPDATE → auth.uid() = user_id
-- Burada sadece eksik olanları ekliyoruz.

-- Giriş yapmış kullanıcılar bildirim oluşturabilir
DROP POLICY IF EXISTS "notif_insert_auth" ON notifications;
CREATE POLICY "notif_insert_auth"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Kullanıcı kendi bildirimini silebilir
DROP POLICY IF EXISTS "notif_delete_self" ON notifications;
CREATE POLICY "notif_delete_self"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════
-- 4. BUSINESS_OWNERS (INSERT ve DELETE eksik)
-- ════════════════════════════════════════════════════════════
-- NOT: 001_initial_schema.sql'de zaten şu politika var:
--   "Owners can view own businesses" → SELECT → auth.uid() = user_id
-- Burada sadece eksik olanları ekliyoruz.

-- Giriş yapmış kullanıcılar kayıt akışında patron kaydı oluşturabilir
DROP POLICY IF EXISTS "bo_insert_auth" ON business_owners;
CREATE POLICY "bo_insert_auth"
  ON business_owners FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Super admin patron kaydını silebilir
DROP POLICY IF EXISTS "bo_delete_super_admin" ON business_owners;
CREATE POLICY "bo_delete_super_admin"
  ON business_owners FOR DELETE
  USING (is_super_admin());


-- ════════════════════════════════════════════════════════════
-- 5. USERS (iş ilişkisi okuma ve super admin SELECT eksik)
-- ════════════════════════════════════════════════════════════
-- NOT: 001_initial_schema.sql'de zaten şu politikalar var:
--   "Users can view own profile"   → SELECT → auth.uid() = id
--   "Users can update own profile" → UPDATE → auth.uid() = id
-- Burada iş ilişkisi olan kullanıcıları görme ve super admin
-- tüm kullanıcıları görme politikalarını ekliyoruz.

-- İş ilişkisi olan kullanıcılar birbirini görebilir:
--   Patron → kendi staff'ını ve müşterilerini
--   Staff  → aynı işletmedeki diğer staff ve müşterileri
--   Müşteri → randevu aldığı staff'ı
DROP POLICY IF EXISTS "users_select_business_related" ON users;
CREATE POLICY "users_select_business_related"
  ON users FOR SELECT
  USING (
    -- Patron: kendi işletmesindeki staff ve müşterileri görebilir
    EXISTS (
      SELECT 1 FROM business_owners bo
      WHERE bo.user_id = auth.uid()
        AND (
          -- İşletmedeki staff
          EXISTS (
            SELECT 1 FROM staff_business sb
            WHERE sb.business_id = bo.business_id
              AND sb.user_id = users.id
          )
          OR
          -- İşletmedeki müşteriler
          EXISTS (
            SELECT 1 FROM business_customers bc
            WHERE bc.business_id = bo.business_id
              AND bc.user_id = users.id
          )
        )
    )
    OR
    -- Staff: aynı işletmedeki diğer staff ve müşterileri görebilir
    EXISTS (
      SELECT 1 FROM staff_business my_sb
      WHERE my_sb.user_id = auth.uid()
        AND my_sb.is_active = true
        AND (
          -- Aynı işletmedeki diğer staff
          EXISTS (
            SELECT 1 FROM staff_business other_sb
            WHERE other_sb.business_id = my_sb.business_id
              AND other_sb.user_id = users.id
          )
          OR
          -- Aynı işletmedeki müşteriler
          EXISTS (
            SELECT 1 FROM business_customers bc
            WHERE bc.business_id = my_sb.business_id
              AND bc.user_id = users.id
          )
        )
    )
    OR
    -- Müşteri: randevu aldığı staff'ı görebilir
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN staff_business sb ON sb.id = a.staff_business_id
      WHERE a.customer_user_id = auth.uid()
        AND sb.user_id = users.id
    )
  );

-- Super admin tüm kullanıcıları görebilir
DROP POLICY IF EXISTS "users_select_super_admin" ON users;
CREATE POLICY "users_select_super_admin"
  ON users FOR SELECT
  USING (is_super_admin());


-- ════════════════════════════════════════════════════════════
-- ✅ 003 — MISSING RLS POLICIES APPLIED SUCCESSFULLY
-- ════════════════════════════════════════════════════════════
