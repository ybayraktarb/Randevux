-- ============================================================
-- RandevuX — Payment Architecture (Migration 005)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. WEBHOOK BİLGİLENDİRMESİ (TRIGGER) İÇİN SQL YÖNERGESİ
-- ────────────────────────────────────────────────────────────
/*
 Supabase Dashboard -> Database -> Webhooks (veya Triggers) menüsünden
 appointments tablosu için INSERT ve UPDATE event'lerine bağlanan, 
 HTTP Request Action (POST -> /api/webhooks/supabase) webhook'unu oluşturabilirsiniz.

 Konsoldan pg_net kullanmak isterseniz örnek yapı şöyledir:
 (Öncelikle pg_net eklentisinin aktif olması gerekir)
 
 CREATE OR REPLACE FUNCTION http_request_appointment_webhook() RETURNS TRIGGER AS $$
 BEGIN
  PERFORM net.http_post(
    url := 'https://' || current_setting('request.headers.host') || '/api/webhooks/supabase',
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    )::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;
 
 CREATE TRIGGER appointment_webhook_trigger
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION http_request_appointment_webhook();
*/

-- ────────────────────────────────────────────────────────────
-- 1. APPOINTMENTS TABLOSU GÜNCELLEMELERİ
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- appointments tablosuna payment_status ekle (Eğer yoksa)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='appointments' AND column_name='payment_status'
  ) THEN
    ALTER TABLE appointments ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (payment_status IN ('pending', 'partial', 'paid'));
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. PAYMENTS TABLOSU OLUŞTURMA
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method TEXT NOT NULL 
    CHECK (payment_method IN ('online', 'cash', 'card')),
  provider_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. PAYMENTS RLS İLİŞKİLERİ
-- ────────────────────────────────────────────────────────────

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- SELECT (Müşteri okur)
DROP POLICY IF EXISTS "payments_select_customer" ON payments;
CREATE POLICY "payments_select_customer"
  ON payments FOR SELECT
  USING (customer_id = auth.uid());

-- SELECT (Staff & Patron okur)
DROP POLICY IF EXISTS "payments_select_business" ON payments;
CREATE POLICY "payments_select_business"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = payments.appointment_id
        AND (is_business_owner(a.business_id) OR is_staff_of(a.business_id))
    )
  );

-- INSERT (Müşteri ödeme kaydı açabilir)
DROP POLICY IF EXISTS "payments_insert_customer" ON payments;
CREATE POLICY "payments_insert_customer"
  ON payments FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- INSERT (Personel ya da Patron elden alınan nakit/pos vb ödemeleri girebilir)
DROP POLICY IF EXISTS "payments_insert_staff" ON payments;
CREATE POLICY "payments_insert_staff"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = payments.appointment_id
        AND (is_business_owner(a.business_id) OR is_staff_of(a.business_id))
    )
  );

-- UPDATE (Admin, Patron - webhook status vs.)
DROP POLICY IF EXISTS "payments_update_business" ON payments;
CREATE POLICY "payments_update_business"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = payments.appointment_id
        AND (is_business_owner(a.business_id) OR is_staff_of(a.business_id))
    )
  );
