-- Add module_id to packages table to support sector-specific packages
ALTER TABLE packages
ADD COLUMN module_id UUID REFERENCES modules(id) ON DELETE SET NULL;

COMMENT ON COLUMN packages.module_id IS 'If set, this package is specific to a particular module (sector). If null, it is available to all.';
