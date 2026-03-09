-- Add is_deleted column to staff_business table
ALTER TABLE staff_business ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_staff_business_is_deleted ON staff_business(is_deleted);

-- Update RLS policies to respect is_deleted if necessary
-- Note: Most existing policies use is_active, but for management we should hide deleted ones entirely.

-- Ensure common views or functions skip deleted staff
-- (Assuming standard SELECT queries will now include .eq('is_deleted', false))
