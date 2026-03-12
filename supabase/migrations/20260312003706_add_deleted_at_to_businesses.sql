-- Add deleted_at column to businesses table for soft-delete support
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create an index for performance on filtering non-deleted businesses
CREATE INDEX IF NOT EXISTS idx_businesses_deleted_at ON businesses(deleted_at) WHERE deleted_at IS NULL;

-- Update RLS to exclude soft-deleted businesses from regular users (if needed)
-- Note: Super Admins should still be able to see them.
-- Assuming standard RLS policies are in place, we should ensure they respect deleted_at.
