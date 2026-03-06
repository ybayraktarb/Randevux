-- Sprint 5: CRM Geliştirmeleri
-- 1. business_customers tablosuna yeni alanlar ekle
ALTER TABLE business_customers
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 2. RLS Politikalarını kontrol et ve gerekirse ekle/güncelle
-- Patronların müşterileri manuel ekleyebilmesi için INSERT yetkisi
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'business_customers' 
        AND policyname = 'Patronlar müşteri ekleyebilir'
    ) THEN
        CREATE POLICY "Patronlar müşteri ekleyebilir" ON business_customers
        FOR INSERT 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM business_owners
                WHERE business_id = business_customers.business_id
                AND user_id = auth.uid()
            )
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'business_customers' 
        AND policyname = 'Patronlar müşterileri güncelleyebilir'
    ) THEN
        CREATE POLICY "Patronlar müşterileri güncelleyebilir" ON business_customers
        FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM business_owners
                WHERE business_id = business_customers.business_id
                AND user_id = auth.uid()
            )
        );
    END IF;
END
$$;

-- 3. customer_notes tablosu için RLS (Zaten var olabilir ama garantiye alalım)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customer_notes' 
        AND policyname = 'Patronlar ve personel not ekleyebilir'
    ) THEN
        CREATE POLICY "Patronlar ve personel not ekleyebilir" ON customer_notes
        FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM business_owners
                WHERE business_id = customer_notes.business_id
                AND user_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM staff_business
                WHERE business_id = customer_notes.business_id
                AND user_id = auth.uid()
            )
        );
    END IF;
END
$$;
