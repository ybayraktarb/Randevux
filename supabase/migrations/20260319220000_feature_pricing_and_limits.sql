-- 1. Add pricing and category columns to features table
ALTER TABLE features 
ADD COLUMN IF NOT EXISTS price_monthly NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_yearly NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Standart';

-- Provide some sample categories or initial dummy prices for existing features (optional, but good for testing)
UPDATE features SET category = 'Temel İşlemler' WHERE key IN ('appointment_system', 'service_management', 'staff_management', 'customer_management');
UPDATE features SET category = 'Finans & Stok' WHERE key IN ('finance_management', 'inventory_management', 'online_payment');
UPDATE features SET category = 'Dijital & AI' WHERE key IN ('ai_assistant', 'advanced_analytics', 'online_booking', 'sms_notifications');

-- Give ai_assistant and advanced_analytics prices to showcase add-ons
UPDATE features SET price_monthly = 500, price_yearly = 5000 WHERE key = 'ai_assistant';
UPDATE features SET price_monthly = 300, price_yearly = 3000 WHERE key = 'advanced_analytics';

-- 2. Staff Limit Enforcement Function & Trigger
CREATE OR REPLACE FUNCTION check_business_staff_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_max_staff INTEGER;
    v_current_staff INTEGER;
BEGIN
    -- Find active package limits (Assuming business has an active subscription)
    SELECT p.max_staff INTO v_max_staff
    FROM subscriptions s
    JOIN packages p ON s.package_id = p.id
    WHERE s.business_id = NEW.business_id 
      AND s.is_active = true 
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- If no target limit or unlimited (null) then allow
    IF v_max_staff IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count active staff for this business
    SELECT count(*) INTO v_current_staff
    FROM staff_business
    WHERE business_id = NEW.business_id
      AND is_active = true
      AND is_deleted = false
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_current_staff >= v_max_staff THEN
        RAISE EXCEPTION 'Maksimum personel limitine ulaşıldı (Kalan: 0, Limit: %)', v_max_staff;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_staff_limit_trigger ON staff_business;
CREATE TRIGGER enforce_staff_limit_trigger
BEFORE INSERT OR UPDATE OF is_active, is_deleted ON staff_business
FOR EACH ROW
WHEN (NEW.is_active = true AND NEW.is_deleted = false AND (TG_OP = 'INSERT' OR OLD.is_active = false OR OLD.is_deleted = true))
EXECUTE FUNCTION check_business_staff_limit();

-- 3. Service Limit Enforcement Function & Trigger
CREATE OR REPLACE FUNCTION check_business_service_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_max_services INTEGER;
    v_current_services INTEGER;
BEGIN
    -- Find active package limits
    SELECT p.max_services INTO v_max_services
    FROM subscriptions s
    JOIN packages p ON s.package_id = p.id
    WHERE s.business_id = NEW.business_id 
      AND s.is_active = true 
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- If no target limit or unlimited (null) then allow
    IF v_max_services IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count active services for this business
    SELECT count(*) INTO v_current_services
    FROM services
    WHERE business_id = NEW.business_id
      AND is_active = true
      AND deleted_at IS NULL
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_current_services >= v_max_services THEN
        RAISE EXCEPTION 'Maksimum hizmet limitine ulaşıldı (Kalan: 0, Limit: %)', v_max_services;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_service_limit_trigger ON services;
CREATE TRIGGER enforce_service_limit_trigger
BEFORE INSERT OR UPDATE OF is_active, deleted_at ON services
FOR EACH ROW
WHEN (NEW.is_active = true AND NEW.deleted_at IS NULL AND (TG_OP = 'INSERT' OR OLD.is_active = false OR OLD.deleted_at IS NOT NULL))
EXECUTE FUNCTION check_business_service_limit();
