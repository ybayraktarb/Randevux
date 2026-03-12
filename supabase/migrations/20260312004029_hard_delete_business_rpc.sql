-- Create a function to permanently delete a business and all its related data (Cascading Hard-Delete)
CREATE OR REPLACE FUNCTION hard_delete_business(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Appointments & Reviews
    DELETE FROM business_reviews WHERE business_id = p_business_id;
    DELETE FROM appointment_status_history WHERE appointment_id IN (SELECT id FROM appointments WHERE business_id = p_business_id);
    DELETE FROM appointments WHERE business_id = p_business_id;

    -- 2. Services & Staff
    DELETE FROM staff_services WHERE business_id = p_business_id;
    DELETE FROM staff_hours WHERE business_id = p_business_id;
    DELETE FROM staff_business WHERE business_id = p_business_id;
    DELETE FROM services WHERE business_id = p_business_id;

    -- 3. Configuration & Content
    DELETE FROM business_hours WHERE business_id = p_business_id;
    DELETE FROM business_announcements WHERE business_id = p_business_id;
    DELETE FROM business_customers WHERE business_id = p_business_id;
    DELETE FROM user_favorites WHERE business_id = p_business_id;
    
    -- 4. Subscription & Owners
    DELETE FROM subscriptions WHERE business_id = p_business_id;
    DELETE FROM business_owners WHERE business_id = p_business_id;
    
    -- 5. Features
    DELETE FROM packages_business WHERE business_id = p_business_id;

    -- 6. Finally delete the business
    DELETE FROM businesses WHERE id = p_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
