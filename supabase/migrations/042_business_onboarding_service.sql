-- ============================================================
-- Migration 042: Business Onboarding Service (Transactional)
-- 
-- 1. sector_default_services: Sektöre özel varsayılan hizmet şablonları.
-- 2. onboard_business: İşletme, Patron, Abonelik ve Hizmetleri 
--    TEK BİR TRANSACTION içinde kuran Enterprise RPC.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SEKTÖR VARSAYILAN HİZMETLERİ (Templates)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sector_default_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 30,
    price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(sector_id, name)
);

ALTER TABLE public.sector_default_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sector_defaults_read_public" ON public.sector_default_services FOR SELECT USING (true);

-- Seed Data: Berber Varsayılan Hizmetleri
DO $$ 
DECLARE v_barber_id UUID;
BEGIN
    SELECT id INTO v_barber_id FROM public.modules WHERE name = 'barber';
    IF v_barber_id IS NOT NULL THEN
        INSERT INTO public.sector_default_services (sector_id, name, description, duration_minutes, price) VALUES
        (v_barber_id, 'Saç Kesimi', 'Klasik model saç kesimi ve yıkama.', 45, 250),
        (v_barber_id, 'Sakal Tıraşı', 'Sakal şekillendirme veya sinekkaydı tıraş.', 20, 150),
        (v_barber_id, 'Saç & Sakal Kombin', 'Komple bakım paketi.', 60, 350)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. ONBOARDING SERVICE (The Atomic RPC)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.onboard_business(
    p_owner_user_id UUID,
    p_business_name TEXT,
    p_sector_id UUID,
    p_package_id UUID,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- [GÜVENLİK]: Sadece Super Admin veya yetkili kayıt akışı çağırabilir.
    -- (auth.uid() kontrolü eklenebilir veya SECURITY DEFINER ile sistem yetkisiyle çalışır)
    
    -- 1. İşletme Kaydı (Atomic Step 1)
    INSERT INTO public.businesses (
        name, 
        module_id, 
        package_id, 
        metadata,
        is_active
    ) VALUES (
        p_business_name, 
        p_sector_id, 
        p_package_id, 
        p_metadata,
        true
    ) RETURNING id INTO v_business_id;

    -- 2. Patron Ataması (Atomic Step 2)
    INSERT INTO public.business_owners (
        user_id, 
        business_id
    ) VALUES (
        p_owner_user_id, 
        v_business_id
    );

    -- 3. Abonelik Başlatma (Atomic Step 3)
    INSERT INTO public.subscriptions (
        business_id, 
        package_id, 
        status, 
        starts_at
    ) VALUES (
        v_business_id, 
        p_package_id, 
        'active', 
        now()
    );

    -- 4. Sektör Varsayılan Hizmetlerini Tohumla (Seeding Logic - Atomic Step 4)
    INSERT INTO public.services (
        business_id, 
        name, 
        description, 
        base_duration_minutes, 
        base_price, 
        is_active
    )
    SELECT 
        v_business_id, 
        name, 
        description, 
        duration_minutes, 
        price, 
        true
    FROM public.sector_default_services
    WHERE sector_id = p_sector_id;

    -- [NOT]: Feature Flag'ler (business_features) Businesses tablosundaki 
    -- trg_sync_features_on_biz_update trigger'ı sayesinde otomatik senkronize olur.

    -- 5. Audit Log (Enterprise Requirement)
    INSERT INTO public.audit_logs (
        business_id, 
        user_id, 
        action, 
        target_table, 
        target_id
    ) VALUES (
        v_business_id, 
        auth.uid(), 
        'created', 
        'businesses', 
        v_business_id
    );

    RETURN v_business_id;

EXCEPTION WHEN OTHERS THEN
    -- Herhangi bir hata durumunda tüm işlemler otomatik olarak ROLLBACK edilir.
    RAISE EXCEPTION 'Onboarding başarısız oldu: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.onboard_business IS 'İşletme, Patron, Abonelik ve Varsayılan Hizmetleri tek bir transaction içinde kuran ana servis fonksiyonu.';
