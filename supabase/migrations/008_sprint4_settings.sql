-- ============================================================
-- Sprint 4: System Settings Migration
-- Description: Creates system_settings table for Super Admin
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SYSTEM SETTINGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Row Level Security (RLS)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Sadece giriş yapmış kullanıcılar (şimdilik) okuyabilir, super_admin kontrolü eklenebilir
CREATE POLICY "Anyone authenticated can view settings"
  ON system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Sadece super_admins güncelleyebilir
CREATE POLICY "Super admins can update settings"
  ON system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can insert settings"
  ON system_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Insert Default Settings
INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode', '{"enabled": false}', 'Sistemi bakım moduna alır. Kullanıcı girişleri kısıtlanabilir.'),
  ('disable_registrations', '{"enabled": false}', 'Sisteme yeni kullanıcı veya işletme kayıtlarını geçici olarak kapatır.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- NOT: notifications tablosu 001_initial_schema.sql içinde
-- zaten mevcut olduğundan burada tekrar oluşturulmamıştır.
-- ============================================================
