-- ============================================================
-- RandevuX — Seed Data
-- ============================================================
-- ⚠️ Bu script çalıştırılmadan önce aşağıdaki kullanıcıların
-- Supabase Auth üzerinden kayıt olması gerekir:
-- 1. Patron: patron@randevux.com (sonra business_owners'a ekle)
-- 2. Personel 1: ayse@randevux.com
-- 3. Personel 2: fatma@randevux.com
-- 4. Personel 3: mehmet@randevux.com
-- 5. Müşteri 1-5: musteri1@randevux.com ... musteri5@randevux.com
--
-- Kullanıcı bağımlı tablolara (business_owners, staff_business,
-- business_customers, appointments vb.) bu script ile veri
-- EKLENMEMEKTEDİR. Bunlar seed-users.js ile doldurulur.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. BUSINESS: Güzellik Salonu Bella
-- ────────────────────────────────────────────────────────────
-- modules tablosundaki 'barber' modülünü referans alıyoruz.
INSERT INTO businesses (id, module_id, name, address, phone, description, auto_approve, cancellation_buffer_minutes)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  (SELECT id FROM modules WHERE name = 'barber'),
  'Güzellik Salonu Bella',
  'Bağcılar, İstanbul',
  '+90 212 000 00 00',
  'Profesyonel güzellik ve bakım hizmetleri sunan modern salon.',
  false,
  60
);

-- ────────────────────────────────────────────────────────────
-- 2. BUSINESS HOURS (Bella — 7 gün)
-- ────────────────────────────────────────────────────────────
-- day_of_week: 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
INSERT INTO business_hours (business_id, day_of_week, open_time, close_time, is_open) VALUES
  ('a0000000-0000-0000-0000-000000000001', 0, '00:00', '00:00', false),  -- Pazar: kapalı
  ('a0000000-0000-0000-0000-000000000001', 1, '09:00', '20:00', true),   -- Pazartesi
  ('a0000000-0000-0000-0000-000000000001', 2, '09:00', '20:00', true),   -- Salı
  ('a0000000-0000-0000-0000-000000000001', 3, '09:00', '20:00', true),   -- Çarşamba
  ('a0000000-0000-0000-0000-000000000001', 4, '09:00', '20:00', true),   -- Perşembe
  ('a0000000-0000-0000-0000-000000000001', 5, '09:00', '20:00', true),   -- Cuma
  ('a0000000-0000-0000-0000-000000000001', 6, '10:00', '18:00', true);   -- Cumartesi

-- ────────────────────────────────────────────────────────────
-- 3. SERVICES (Bella — 6 hizmet)
-- ────────────────────────────────────────────────────────────
INSERT INTO services (business_id, name, description, base_duration_minutes, base_price, buffer_time_minutes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Saç Kesimi',     'Profesyonel saç kesim hizmeti',           45,  350.00, 5),
  ('a0000000-0000-0000-0000-000000000001', 'Saç Boyama',     'Saç boyama ve renklendirme',             120,  800.00, 10),
  ('a0000000-0000-0000-0000-000000000001', 'Keratin Bakımı', 'Keratin saç bakım uygulaması',            90, 1200.00, 10),
  ('a0000000-0000-0000-0000-000000000001', 'Manikür',        'El bakımı ve oje uygulaması',             30,  200.00, 5),
  ('a0000000-0000-0000-0000-000000000001', 'Pedikür',        'Ayak bakımı ve oje uygulaması',           45,  250.00, 5),
  ('a0000000-0000-0000-0000-000000000001', 'Cilt Bakımı',    'Profesyonel cilt bakımı ve temizliği',    60,  450.00, 5);

-- ════════════════════════════════════════════════════════════
-- ✅ SEED DATA INSERTED SUCCESSFULLY
-- ════════════════════════════════════════════════════════════
