-- ============================================================
-- Migration 046: Enterprise Billing & Legal Invoice Compliance
-- 
-- Bu migration, platformun yasal fatura gereksinimlerini
-- karşılamak için fatura profilleri ve detay satırları ekler.
-- ============================================================

-- 1. platform_billing_profiles (İşletme Vergi ve Fatura Bilgileri)
CREATE TABLE IF NOT EXISTS public.platform_billing_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,         -- Şirket Tam Ünvanı
    tax_office TEXT,                   -- Vergi Dairesi
    tax_number TEXT,                   -- Vergi No / TC No
    address TEXT NOT NULL,             -- Yasal Adres
    city TEXT,                         -- Şehir
    country TEXT DEFAULT 'Türkiye',
    billing_email TEXT,                -- Faturanın gönderileceği adres (opsiyonel)
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id)
);

-- 2. platform_invoice_items (Fatura Satırları / Breakdown)
CREATE TABLE IF NOT EXISTS public.platform_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.platform_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,         -- Örn: "Profesyonel Paket - Mart 2024"
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 20.00, -- KDV Oranı (Varsayılan %20)
    tax_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL, -- (unit_price * quantity) + tax_amount
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. platform_transactions tablosuna vergi alanları ekleme
ALTER TABLE public.platform_transactions
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS tax_total DECIMAL(10, 2);

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.platform_billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_invoice_items ENABLE ROW LEVEL SECURITY;

-- Super Admin Yetkileri
CREATE POLICY "Super Admin fatura profillerini yönetebilir" ON public.platform_billing_profiles
    FOR ALL USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

CREATE POLICY "Super Admin fatura satırlarını görebilir" ON public.platform_invoice_items
    FOR ALL USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

-- Patron Yetkileri
CREATE POLICY "Patronlar kendi fatura profillerini görebilir ve güncelleyebilir" ON public.platform_billing_profiles
    FOR ALL USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Patronlar kendi fatura detaylarını görebilir" ON public.platform_invoice_items
    FOR SELECT USING (
        invoice_id IN (SELECT id FROM public.platform_invoices WHERE business_id IN (
            SELECT business_id FROM public.business_owners WHERE user_id = auth.uid()
        ))
    );

-- ────────────────────────────────────────────────────────────
-- TRIGGERS: Updated At
-- ────────────────────────────────────────────────────────────
CREATE TRIGGER trg_update_platform_billing_profiles_modtime
    BEFORE UPDATE ON public.platform_billing_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ════════════════════════════════════════════════════════════
-- ✅ MIGRATION 046 TAMAMLANDI
-- ════════════════════════════════════════════════════════════
