-- ============================================================
-- Fix Audit Logs Relationship
-- ============================================================

-- Add proper foreign key to 'audit_logs' so PostgREST can resolve the join with 'users' 
ALTER TABLE IF EXISTS public.audit_logs 
  DROP CONSTRAINT IF EXISTS audit_logs_changed_by_fkey;

ALTER TABLE IF EXISTS public.audit_logs
  ADD CONSTRAINT audit_logs_changed_by_fkey
  FOREIGN KEY (changed_by)
  REFERENCES public.users (id)
  ON DELETE SET NULL;
