-- ============================================================
-- RandevuX — Restrict Business Insert to Super Admins (Migration 006)
-- ============================================================

-- Drop the old policy
DROP POLICY IF EXISTS "business_insert" ON businesses;

-- Create the new policy allowing ONLY super admins to insert businesses
CREATE POLICY "business_insert"
  ON businesses FOR INSERT
  WITH CHECK (is_super_admin());
