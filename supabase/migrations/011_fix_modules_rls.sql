-- ============================================================
-- Fix: Modül eklerken alınan "column 'role' does not exist" hatasını çözer
-- ============================================================
-- Supabase arayüzünden veya arka plandan modules tablosuna 
-- yanlış bir RLS (Row Level Security) kuralı eklenmiş olabilir.
-- Bu script:
-- 1. Tablodaki tüm hatalı veya gizli RLS kurallarını sıfırlar.
-- 2. "modules" tablosu için yalnızca Super Admin işlemlerine izin veren
--    doğru ve güvenli kuralları sıfırdan oluşturur.

DO $$ 
DECLARE
    pol record;
BEGIN
    -- modules tablosundaki tüm mevcut RLS politikalarını bul ve sil
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'modules'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON modules', pol.policyname);
    END LOOP;
END $$;

-- RLS'i aktif et
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- 1. Herkes (veya en azından sisteme girenler) modülleri görebilir
CREATE POLICY "modules_select_all"
  ON modules FOR SELECT
  USING (true);

-- 2. Sadece Super Admin moduül ekleyebilir
CREATE POLICY "modules_insert_admin"
  ON modules FOR INSERT
  WITH CHECK (is_super_admin());

-- 3. Sadece Super Admin modül güncelleyebilir
CREATE POLICY "modules_update_admin"
  ON modules FOR UPDATE
  USING (is_super_admin());

-- 4. Sadece Super Admin modül silebilir
CREATE POLICY "modules_delete_admin"
  ON modules FOR DELETE
  USING (is_super_admin());
