-- ============================================================
-- Migration 045: Platform Billing & Invoicing Infrastructure
-- 
-- Bu migration, RandevuX platformunun işletmelerden yaptığı 
-- tahsilatları (SaaS ödemeleri) ve faturaları takip etmek için
-- gerekli tabloları oluşturur.
-- ============================================================

-- 1. platform_transactions (Platform Tahsilatları)
CREATE TABLE IF NOT EXISTS public.platform_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    payment_provider TEXT CHECK (payment_provider IN ('iyzico', 'stripe', 'manual', 'bank_transfer')),
    provider_transaction_id TEXT, -- Aracı kurumdaki ID (iyzico pay_id vb.)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. platform_invoices (Platform Faturaları)
CREATE TABLE IF NOT EXISTS public.platform_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.platform_transactions(id) ON DELETE SET NULL,
    invoice_no TEXT UNIQUE NOT NULL, -- Örn: RNX-2024-0001
    billing_email TEXT,
    total_amount DECIMAL(10, 2) NOT NULL,
    pdf_url TEXT,
    status TEXT DEFAULT 'paid' CHECK (status IN ('draft', 'sent', 'paid', 'void')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.platform_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_invoices ENABLE ROW LEVEL SECURITY;

-- Sadece Super Admin her şeyi görebilir
CREATE POLICY "Super Admin platform işlemlerini görebilir" ON public.platform_transactions
    FOR ALL USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

CREATE POLICY "Super Admin platform faturalarını görebilir" ON public.platform_invoices
    FOR ALL USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

-- İşletme Sahibi (Patron) sadece kendi ödemelerini ve faturalarını görebilir
CREATE POLICY "Patronlar kendi platform ödemelerini görebilir" ON public.platform_transactions
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Patronlar kendi faturalarını görebilir" ON public.platform_invoices
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_platform_trans_business ON public.platform_transactions(business_id);
CREATE INDEX idx_platform_invoices_business ON public.platform_invoices(business_id);
CREATE INDEX idx_platform_trans_status ON public.platform_transactions(status);

-- ────────────────────────────────────────────────────────────
-- TRIGGERS: Updated At
-- ────────────────────────────────────────────────────────────
CREATE TRIGGER trg_update_platform_transactions_modtime
    BEFORE UPDATE ON public.platform_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ════════════════════════════════════════════════════════════
-- ✅ MIGRATION 045 TAMAMLANDI
-- ════════════════════════════════════════════════════════════
