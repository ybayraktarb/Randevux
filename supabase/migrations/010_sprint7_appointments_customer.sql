-- ============================================================
-- Sprint 7 - Appointments Tablosu Müşteri İlişkisi Düzeltmesi
-- ============================================================
-- Bu dosyayı Supabase Dashboard → SQL Editor'da çalıştırın.

-- 1. appointments tablosundaki customer_user_id alanının zorunluluğunu kaldırıyoruz
-- (Çünkü kayıtlı olmayan veya sadece telefonla arayan walk-in müşteriler için bu alan boş olabilir)
ALTER TABLE appointments ALTER COLUMN customer_user_id DROP NOT NULL;

-- 2. business_customers (işletmeye özel müşteri defteri) ile randevuları bağlamak için yeni kolon
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES business_customers(id) ON DELETE SET NULL;

-- 3. Performans için index ekleyelim
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);

-- ====== MIGRATION SONU ======
