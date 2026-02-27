-- ============================================================
-- RandevuX — Full Database Schema
-- Version: 1.0.0
-- Date: 2024-02-24
-- ============================================================
-- Bu dosyayı Supabase Dashboard → SQL Editor'da çalıştırın.
-- Tüm tabloları, constraint'leri ve RLS politikalarını oluşturur.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. MODULES
-- ────────────────────────────────────────────────────────────
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed: Default module
INSERT INTO modules (name, display_name, is_active) VALUES
  ('barber', 'Berber', true),
  ('veterinary', 'Veterinerlik', false),
  ('health', 'Sağlık', false);

-- ────────────────────────────────────────────────────────────
-- 2. BUSINESSES
-- ────────────────────────────────────────────────────────────
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  description TEXT,
  logo_url TEXT,
  qr_code TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  invite_code TEXT UNIQUE,
  auto_approve BOOLEAN DEFAULT false,
  cancellation_buffer_minutes INT DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. USERS (Supabase Auth ile senkronize)
-- ────────────────────────────────────────────────────────────
-- NOT: Supabase Auth kendi auth.users tablosunu yönetir.
-- Bu tablo uygulama profil verisi içindir.
-- auth.users.id ile eşleşir (id = auth.uid()).
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  phone_verified_at TIMESTAMPTZ,
  name TEXT,
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'email'
    CHECK (auth_provider IN ('email', 'google', 'apple', 'phone')),
  provider_id TEXT,
  kvkk_consent BOOLEAN NOT NULL DEFAULT false,
  kvkk_consent_at TIMESTAMPTZ,
  commercial_consent BOOLEAN DEFAULT false,
  commercial_consent_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 4. SUPER ADMINS ✏️ YENİ
-- ────────────────────────────────────────────────────────────
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ────────────────────────────────────────────────────────────
-- 5. BUSINESS OWNERS (Patron)
-- ────────────────────────────────────────────────────────────
CREATE TABLE business_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- ────────────────────────────────────────────────────────────
-- 6. STAFF BUSINESS ✏️ DEĞİŞTİ (staff tablosu kaldırıldı)
-- ────────────────────────────────────────────────────────────
CREATE TABLE staff_business (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  can_set_own_price BOOLEAN DEFAULT false,
  can_set_own_duration BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- ────────────────────────────────────────────────────────────
-- 7. STAFF INVITATIONS ✏️ YENİ
-- ────────────────────────────────────────────────────────────
CREATE TABLE staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id),
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);

-- ────────────────────────────────────────────────────────────
-- 8. BUSINESS CUSTOMERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE business_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  connected_at TIMESTAMPTZ DEFAULT now(),
  is_blocked BOOLEAN DEFAULT false,
  UNIQUE(user_id, business_id)
);

-- ────────────────────────────────────────────────────────────
-- 9. SERVICES
-- ────────────────────────────────────────────────────────────
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_duration_minutes INT NOT NULL DEFAULT 30,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  buffer_time_minutes INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 10. STAFF SERVICES
-- ────────────────────────────────────────────────────────────
CREATE TABLE staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_business_id UUID NOT NULL REFERENCES staff_business(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2),
  custom_duration_minutes INT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(staff_business_id, service_id)
);

-- ────────────────────────────────────────────────────────────
-- 11. BUSINESS HOURS ✏️ YENİ
-- ────────────────────────────────────────────────────────────
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, day_of_week)
);

-- ────────────────────────────────────────────────────────────
-- 12. WORK SCHEDULE TEMPLATES
-- ────────────────────────────────────────────────────────────
CREATE TABLE work_schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_business_id UUID NOT NULL REFERENCES staff_business(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_working BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_business_id, day_of_week)
);

-- ────────────────────────────────────────────────────────────
-- 13. BREAK SCHEDULES
-- ────────────────────────────────────────────────────────────
CREATE TABLE break_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_business_id UUID NOT NULL REFERENCES staff_business(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT DEFAULT 'Mola',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 14. BUSINESS CLOSED DATES
-- ────────────────────────────────────────────────────────────
CREATE TABLE business_closed_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, date)
);

-- ────────────────────────────────────────────────────────────
-- 15. APPOINTMENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_user_id UUID NOT NULL REFERENCES users(id),
  staff_business_id UUID NOT NULL REFERENCES staff_business(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_duration_minutes INT NOT NULL DEFAULT 0,
  customer_note TEXT,
  cancelled_by TEXT
    CHECK (cancelled_by IN ('customer', 'staff', 'system')),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 16. APPOINTMENT SERVICES
-- ────────────────────────────────────────────────────────────
CREATE TABLE appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  staff_service_id UUID REFERENCES staff_services(id),
  price_snapshot DECIMAL(10,2) NOT NULL,
  duration_snapshot INT NOT NULL,
  buffer_snapshot INT DEFAULT 0
);

-- ────────────────────────────────────────────────────────────
-- 17. CUSTOMER NOTES
-- ────────────────────────────────────────────────────────────
CREATE TABLE customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_user_id UUID NOT NULL REFERENCES users(id),
  staff_business_id UUID NOT NULL REFERENCES staff_business(id),
  appointment_id UUID REFERENCES appointments(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 18. NO SHOW RECORDS
-- ────────────────────────────────────────────────────────────
CREATE TABLE no_show_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  marked_by_staff_business_id UUID NOT NULL REFERENCES staff_business(id),
  marked_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 19. LEAVE REQUESTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_business_id UUID NOT NULL REFERENCES staff_business(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL
    CHECK (request_type IN ('full_day', 'partial')),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 20. NOTIFICATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN (
      'appointment_created', 'appointment_confirmed',
      'appointment_cancelled', 'reminder', 'leave_result',
      'staff_invitation', 'system'
    )),
  title TEXT NOT NULL,
  body TEXT,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 21. DEVICE TOKENS ✏️ YENİ
-- ────────────────────────────────────────────────────────────
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- ────────────────────────────────────────────────────────────
-- 22. ASSETS (Pasif — Gelecek Modüller)
-- ────────────────────────────────────────────────────────────
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 23. APPOINTMENT ASSETS (Pasif — Gelecek Modüller)
-- ────────────────────────────────────────────────────────────
CREATE TABLE appointment_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 24. APPOINTMENT FILES (Pasif — Gelecek Modüller)
-- ────────────────────────────────────────────────────────────
CREATE TABLE appointment_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 25. AUDIT LOGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL
    CHECK (action IN ('viewed', 'created', 'updated', 'deleted')),
  target_table TEXT NOT NULL,
  target_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- INDEXES (Performans)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_appointments_business ON appointments(business_id);
CREATE INDEX idx_appointments_customer ON appointments(customer_user_id);
CREATE INDEX idx_appointments_staff ON appointments(staff_business_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_staff_business_user ON staff_business(user_id);
CREATE INDEX idx_staff_business_business ON staff_business(business_id);
CREATE INDEX idx_business_owners_user ON business_owners(user_id);
CREATE INDEX idx_business_customers_user ON business_customers(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_business_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_table, target_id);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (Temel Politikalar)
-- ────────────────────────────────────────────────────────────

-- Users: Herkes kendi profilini görebilir
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Notifications: Herkes kendi bildirimlerini görür
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Device Tokens: Herkes kendi token'larını yönetir
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own device tokens"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Super Admins: Role kontrolü için SELECT izni
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own admin status"
  ON super_admins FOR SELECT
  USING (auth.uid() = user_id);

-- Business Owners: Role kontrolü için SELECT izni
ALTER TABLE business_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view own businesses"
  ON business_owners FOR SELECT
  USING (auth.uid() = user_id);

-- Staff Business: Role kontrolü için SELECT izni
ALTER TABLE staff_business ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view own records"
  ON staff_business FOR SELECT
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- TRIGGER: Kullanıcı kayıt olunca otomatik profil oluştur
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════════
-- ✅ SCHEMA CREATED SUCCESSFULLY
-- ════════════════════════════════════════════════════════════
