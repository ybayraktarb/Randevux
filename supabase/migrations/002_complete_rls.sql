-- ============================================================
-- RandevuX — Complete RLS Policies (Migration 002)
-- ============================================================
-- Bu migration, 001_initial_schema.sql'de RLS'si olmayan
-- 12 tablo için kapsamlı Row Level Security politikaları ekler.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- YARDIMCI FONKSİYONLAR
-- ────────────────────────────────────────────────────────────

-- İşletme sahibi mi?
CREATE OR REPLACE FUNCTION public.is_business_owner(_business_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_owners
    WHERE user_id = auth.uid()
      AND business_id = _business_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- İşletme personeli mi?
CREATE OR REPLACE FUNCTION public.is_staff_of(_business_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_business
    WHERE user_id = auth.uid()
      AND business_id = _business_id
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- İşletme müşterisi mi?
CREATE OR REPLACE FUNCTION public.is_customer_of(_business_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM business_customers
    WHERE user_id = auth.uid()
      AND business_id = _business_id
      AND is_blocked = false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Super admin mi?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ════════════════════════════════════════════════════════════
-- 1. BUSINESSES
-- ════════════════════════════════════════════════════════════
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- SELECT: Patron, personel ve müşteriler (kendi işletmesini)
CREATE POLICY "business_select_owner"
  ON businesses FOR SELECT
  USING (is_business_owner(id));

CREATE POLICY "business_select_staff"
  ON businesses FOR SELECT
  USING (is_staff_of(id));

CREATE POLICY "business_select_customer"
  ON businesses FOR SELECT
  USING (is_customer_of(id));

CREATE POLICY "business_select_super_admin"
  ON businesses FOR SELECT
  USING (is_super_admin());

-- INSERT: Sadece authenticated kullanıcılar yeni iş yeri oluşturabilir
CREATE POLICY "business_insert"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Sadece patron
CREATE POLICY "business_update_owner"
  ON businesses FOR UPDATE
  USING (is_business_owner(id));

-- DELETE: Sadece patron
CREATE POLICY "business_delete_owner"
  ON businesses FOR DELETE
  USING (is_business_owner(id));


-- ════════════════════════════════════════════════════════════
-- 2. SERVICES
-- ════════════════════════════════════════════════════════════
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- SELECT: Patron, personel ve müşteriler okuyabilir
CREATE POLICY "services_select_owner"
  ON services FOR SELECT
  USING (is_business_owner(business_id));

CREATE POLICY "services_select_staff"
  ON services FOR SELECT
  USING (is_staff_of(business_id));

CREATE POLICY "services_select_customer"
  ON services FOR SELECT
  USING (is_customer_of(business_id));

-- INSERT: Sadece patron
CREATE POLICY "services_insert_owner"
  ON services FOR INSERT
  WITH CHECK (is_business_owner(business_id));

-- UPDATE: Sadece patron
CREATE POLICY "services_update_owner"
  ON services FOR UPDATE
  USING (is_business_owner(business_id));

-- DELETE: Sadece patron
CREATE POLICY "services_delete_owner"
  ON services FOR DELETE
  USING (is_business_owner(business_id));


-- ════════════════════════════════════════════════════════════
-- 3. APPOINTMENTS
-- ════════════════════════════════════════════════════════════
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- SELECT: Müşteri kendi randevularını, staff kendi randevularını, patron tümünü
CREATE POLICY "appointments_select_customer"
  ON appointments FOR SELECT
  USING (auth.uid() = customer_user_id);

CREATE POLICY "appointments_select_staff"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = appointments.staff_business_id
        AND sb.user_id = auth.uid()
        AND sb.is_active = true
    )
  );

CREATE POLICY "appointments_select_owner"
  ON appointments FOR SELECT
  USING (is_business_owner(business_id));

-- INSERT: Müşteri kendi randevusunu oluşturur
CREATE POLICY "appointments_insert_customer"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = customer_user_id);

-- Patron da randevu oluşturabilir
CREATE POLICY "appointments_insert_owner"
  ON appointments FOR INSERT
  WITH CHECK (is_business_owner(business_id));

-- UPDATE: Staff kendi randevularını günceller
CREATE POLICY "appointments_update_staff"
  ON appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = appointments.staff_business_id
        AND sb.user_id = auth.uid()
        AND sb.is_active = true
    )
  );

-- UPDATE: Müşteri kendi randevusunu güncelleyebilir (iptal vb.)
CREATE POLICY "appointments_update_customer"
  ON appointments FOR UPDATE
  USING (auth.uid() = customer_user_id);

-- UPDATE: Patron tüm işletme randevularını yönetir
CREATE POLICY "appointments_update_owner"
  ON appointments FOR UPDATE
  USING (is_business_owner(business_id));

-- DELETE: Patron işletme randevularını silebilir
CREATE POLICY "appointments_delete_owner"
  ON appointments FOR DELETE
  USING (is_business_owner(business_id));


-- ════════════════════════════════════════════════════════════
-- 4. APPOINTMENT_SERVICES
-- ════════════════════════════════════════════════════════════
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- SELECT: Randevuyu görebilen herkes (müşteri, staff, patron)
CREATE POLICY "appt_services_select_customer"
  ON appointment_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_services.appointment_id
        AND a.customer_user_id = auth.uid()
    )
  );

CREATE POLICY "appt_services_select_staff"
  ON appointment_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN staff_business sb ON sb.id = a.staff_business_id
      WHERE a.id = appointment_services.appointment_id
        AND sb.user_id = auth.uid()
        AND sb.is_active = true
    )
  );

CREATE POLICY "appt_services_select_owner"
  ON appointment_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_services.appointment_id
        AND is_business_owner(a.business_id)
    )
  );

-- INSERT: Müşteri ve patron
CREATE POLICY "appt_services_insert_customer"
  ON appointment_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_services.appointment_id
        AND a.customer_user_id = auth.uid()
    )
  );

CREATE POLICY "appt_services_insert_owner"
  ON appointment_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_services.appointment_id
        AND is_business_owner(a.business_id)
    )
  );

-- UPDATE: Patron
CREATE POLICY "appt_services_update_owner"
  ON appointment_services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_services.appointment_id
        AND is_business_owner(a.business_id)
    )
  );

-- DELETE: Patron
CREATE POLICY "appt_services_delete_owner"
  ON appointment_services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_services.appointment_id
        AND is_business_owner(a.business_id)
    )
  );


-- ════════════════════════════════════════════════════════════
-- 5. CUSTOMER_NOTES
-- ════════════════════════════════════════════════════════════
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- SELECT: Sadece ilgili işletmenin staff'ı ve patronu
CREATE POLICY "customer_notes_select_owner"
  ON customer_notes FOR SELECT
  USING (is_business_owner(business_id));

CREATE POLICY "customer_notes_select_staff"
  ON customer_notes FOR SELECT
  USING (is_staff_of(business_id));

-- INSERT: Staff ve patron
CREATE POLICY "customer_notes_insert_staff"
  ON customer_notes FOR INSERT
  WITH CHECK (is_staff_of(business_id) OR is_business_owner(business_id));

-- UPDATE: Notu yazan staff veya patron
CREATE POLICY "customer_notes_update_staff"
  ON customer_notes FOR UPDATE
  USING (
    (is_staff_of(business_id) AND EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = customer_notes.staff_business_id
        AND sb.user_id = auth.uid()
    ))
    OR is_business_owner(business_id)
  );

-- DELETE: Patron
CREATE POLICY "customer_notes_delete_owner"
  ON customer_notes FOR DELETE
  USING (is_business_owner(business_id));


-- ════════════════════════════════════════════════════════════
-- 6. NO_SHOW_RECORDS
-- ════════════════════════════════════════════════════════════
ALTER TABLE no_show_records ENABLE ROW LEVEL SECURITY;

-- SELECT: Staff ve patron (appointment üzerinden business_id'yi bulur)
CREATE POLICY "no_show_select_staff"
  ON no_show_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = no_show_records.appointment_id
        AND (is_staff_of(a.business_id) OR is_business_owner(a.business_id))
    )
  );

-- INSERT: Staff ve patron
CREATE POLICY "no_show_insert_staff"
  ON no_show_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = no_show_records.appointment_id
        AND (is_staff_of(a.business_id) OR is_business_owner(a.business_id))
    )
  );

-- UPDATE: Patron
CREATE POLICY "no_show_update_owner"
  ON no_show_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = no_show_records.appointment_id
        AND is_business_owner(a.business_id)
    )
  );

-- DELETE: Patron
CREATE POLICY "no_show_delete_owner"
  ON no_show_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = no_show_records.appointment_id
        AND is_business_owner(a.business_id)
    )
  );


-- ════════════════════════════════════════════════════════════
-- 7. LEAVE_REQUESTS
-- ════════════════════════════════════════════════════════════
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: Staff kendi taleplerini, patron tüm işletme taleplerini
CREATE POLICY "leave_select_staff"
  ON leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = leave_requests.staff_business_id
        AND sb.user_id = auth.uid()
    )
  );

CREATE POLICY "leave_select_owner"
  ON leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = leave_requests.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );

-- INSERT: Staff kendi talebini oluşturur
CREATE POLICY "leave_insert_staff"
  ON leave_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = leave_requests.staff_business_id
        AND sb.user_id = auth.uid()
    )
  );

-- UPDATE: Patron onaylar/reddeder
CREATE POLICY "leave_update_owner"
  ON leave_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = leave_requests.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );

-- DELETE: Patron
CREATE POLICY "leave_delete_owner"
  ON leave_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = leave_requests.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );


-- ════════════════════════════════════════════════════════════
-- 8. WORK_SCHEDULE_TEMPLATES
-- ════════════════════════════════════════════════════════════
ALTER TABLE work_schedule_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: Staff kendi şablonunu, patron tümünü
CREATE POLICY "wst_select_staff"
  ON work_schedule_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = work_schedule_templates.staff_business_id
        AND sb.user_id = auth.uid()
    )
  );

CREATE POLICY "wst_select_owner"
  ON work_schedule_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = work_schedule_templates.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );

-- INSERT: Patron
CREATE POLICY "wst_insert_owner"
  ON work_schedule_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = work_schedule_templates.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );

-- UPDATE: Patron
CREATE POLICY "wst_update_owner"
  ON work_schedule_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = work_schedule_templates.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );

-- DELETE: Patron
CREATE POLICY "wst_delete_owner"
  ON work_schedule_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = work_schedule_templates.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );


-- ════════════════════════════════════════════════════════════
-- 9. BREAK_SCHEDULES
-- ════════════════════════════════════════════════════════════
ALTER TABLE break_schedules ENABLE ROW LEVEL SECURITY;

-- SELECT: Staff kendi molasını, patron tümünü
CREATE POLICY "break_select_staff"
  ON break_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = break_schedules.staff_business_id
        AND sb.user_id = auth.uid()
    )
  );

CREATE POLICY "break_select_owner"
  ON break_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = break_schedules.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );

-- INSERT: Patron
CREATE POLICY "break_insert_owner"
  ON break_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = break_schedules.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );

-- UPDATE: Patron
CREATE POLICY "break_update_owner"
  ON break_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = break_schedules.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );

-- DELETE: Patron
CREATE POLICY "break_delete_owner"
  ON break_schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_business sb
      WHERE sb.id = break_schedules.staff_business_id
        AND is_business_owner(sb.business_id)
    )
  );


-- ════════════════════════════════════════════════════════════
-- 10. BUSINESS_HOURS
-- ════════════════════════════════════════════════════════════
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- SELECT: Patron, staff ve müşteri okuyabilir
CREATE POLICY "bh_select_owner"
  ON business_hours FOR SELECT
  USING (is_business_owner(business_id));

CREATE POLICY "bh_select_staff"
  ON business_hours FOR SELECT
  USING (is_staff_of(business_id));

CREATE POLICY "bh_select_customer"
  ON business_hours FOR SELECT
  USING (is_customer_of(business_id));

-- INSERT: Patron
CREATE POLICY "bh_insert_owner"
  ON business_hours FOR INSERT
  WITH CHECK (is_business_owner(business_id));

-- UPDATE: Patron
CREATE POLICY "bh_update_owner"
  ON business_hours FOR UPDATE
  USING (is_business_owner(business_id));

-- DELETE: Patron
CREATE POLICY "bh_delete_owner"
  ON business_hours FOR DELETE
  USING (is_business_owner(business_id));


-- ════════════════════════════════════════════════════════════
-- 11. BUSINESS_CLOSED_DATES
-- ════════════════════════════════════════════════════════════
ALTER TABLE business_closed_dates ENABLE ROW LEVEL SECURITY;

-- SELECT: Patron, staff ve müşteri
CREATE POLICY "bcd_select_owner"
  ON business_closed_dates FOR SELECT
  USING (is_business_owner(business_id));

CREATE POLICY "bcd_select_staff"
  ON business_closed_dates FOR SELECT
  USING (is_staff_of(business_id));

CREATE POLICY "bcd_select_customer"
  ON business_closed_dates FOR SELECT
  USING (is_customer_of(business_id));

-- INSERT: Patron
CREATE POLICY "bcd_insert_owner"
  ON business_closed_dates FOR INSERT
  WITH CHECK (is_business_owner(business_id));

-- UPDATE: Patron
CREATE POLICY "bcd_update_owner"
  ON business_closed_dates FOR UPDATE
  USING (is_business_owner(business_id));

-- DELETE: Patron
CREATE POLICY "bcd_delete_owner"
  ON business_closed_dates FOR DELETE
  USING (is_business_owner(business_id));


-- ════════════════════════════════════════════════════════════
-- 12. AUDIT_LOGS
-- ════════════════════════════════════════════════════════════
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Sadece super_admin
CREATE POLICY "audit_select_super_admin"
  ON audit_logs FOR SELECT
  USING (is_super_admin());

-- INSERT: Sistem (service_role) — RLS bypass eder.
-- Ek olarak, uygulama katmanından yazılabilmesi için:
CREATE POLICY "audit_insert_authenticated"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Kimse güncelleyemez (audit log değiştirilemez)
-- (Policy yok = erişim yok)

-- DELETE: Kimse silemez (audit log silinemez)
-- (Policy yok = erişim yok)


-- ════════════════════════════════════════════════════════════
-- ✅ RLS POLICIES CREATED SUCCESSFULLY
-- ════════════════════════════════════════════════════════════
