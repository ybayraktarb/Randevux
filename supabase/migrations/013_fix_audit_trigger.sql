-- ============================================================
-- RandevuX — Sprint 1: Fix Audit Log Trigger for Service Role
-- Version: 1.0.2
-- Date: 2024-03-02
-- Description: Fixes 'Database error creating new user' during Admin user creation
-- ============================================================

-- 1. FOREIGN KEY KISITLAMASINI GÜVENLİCE KALDIR (Eğer kullanıcı kaldıramadıysa garanti olsun)
ALTER TABLE IF EXISTS public.audit_logs 
  DROP CONSTRAINT IF EXISTS audit_logs_changed_by_fkey;

-- 2. TRIGGER FONKSİYONUNU GÜNCELLE
-- Eğer işlemi yapan kişi Supabase Auth (Service Role vb) ise auth.uid() null döner.
-- Bu durumu güvenli bir şekilde karşılayarak FK hatası veya trigger çökmesi önleniyor.
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_record_id UUID;
    v_changed_by UUID := NULL;
BEGIN
    -- changed_by ID'sini auth.uid() ile al, eğer dönmezse NULL bırak
    BEGIN
        v_changed_by := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_changed_by := NULL;
    END;

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

    -- Eğer auth.uid() public.users'da yoksa (Service Role ise), NULL olarak tut.
    IF v_changed_by IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_changed_by) THEN
            v_changed_by := NULL;
        END IF;
    END IF;

    INSERT INTO public.audit_logs (
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
        v_changed_by
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. KISITLAMAYI YENİDEN VE GÜVENLİCE EKLE
ALTER TABLE IF EXISTS public.audit_logs
  ADD CONSTRAINT audit_logs_changed_by_fkey
  FOREIGN KEY (changed_by)
  REFERENCES public.users (id)
  ON DELETE SET NULL;
