-- ==============================================================================
-- SPRINT 6: Gelişmiş Finans, Raporlama ve Kasa Yönetimi
-- Kasa hareketleri (transactions), personel prim/hak ediş tanımları (staff_commissions)
-- ve hesaplanan maaş dönemleri (payroll_records).
-- ==============================================================================

-- 1. transactions (Kasa Hareketleri & Giderler)
-- Ortak Fonksiyon: updated_at alanini otomatik guncellemek icin
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL, -- e.g., 'service', 'product', 'rent', 'supplies', 'salary', 'other'
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'transfer', 'other')),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    description TEXT,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL, -- Opsiyonel (Randevudan geliyorsa)
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Kim kaydetti
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_transactions_business_id ON public.transactions(business_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- Trigger for updated_at
CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 2. staff_commissions (Personel Prim Kuralları)
-- İşletme, her personel için genel veya hizmet/ürün bazlı komisyon oranı belirler.
CREATE TABLE public.staff_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_business_id UUID NOT NULL REFERENCES public.staff_business(id) ON DELETE CASCADE,
    service_commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- Hizmetlerden alacağı yüzdelik pay (Örn: %40)
    product_commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- Ürün satışından alacağı yüzdelik pay (Örn: %10)
    base_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Sabit maaş tanımlamak istenirse (opsiyonel)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(staff_business_id) -- Her personelin bir prim kuralı olur
);

-- Trigger for updated_at
CREATE TRIGGER update_staff_commissions_modtime
    BEFORE UPDATE ON public.staff_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 3. payroll_records (Tamamlanmış Hak Ediş/Maaş Ödemeleri)
-- Ay veya hafta sonunda personelin kazandığı prim + maaş hesaplanıp buraya "ödendi" olarak işlenir.
CREATE TABLE public.payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    staff_business_id UUID NOT NULL REFERENCES public.staff_business(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    service_commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    product_commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (status IN ('draft', 'paid')),
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payroll_records_business ON public.payroll_records(business_id);
CREATE INDEX idx_payroll_records_staff ON public.payroll_records(staff_business_id);

-- Trigger for updated_at
CREATE TRIGGER update_payroll_records_modtime
    BEFORE UPDATE ON public.payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- ==============================================================================
-- RLS (Row Level Security) POLICIES
-- ==============================================================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- TRANSACTIONS POLICIES
-- Patronlar kendi işletmelerindeki hareketleri görebilir, ekleyebilir, güncelleyebilir ve silebilir.
-- ------------------------------------------------------------------------------
CREATE POLICY "Patronlar kendi isletme kasa hareketlerini gorebilir" ON public.transactions
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Patronlar kendi isletmelerine kasa hareketi ekleyebilir" ON public.transactions
    FOR INSERT WITH CHECK (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Patronlar kendi isletme kasa hareketlerini guncelleyebilir" ON public.transactions
    FOR UPDATE USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    ) WITH CHECK (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Patronlar kendi isletme kasa hareketlerini silebilir" ON public.transactions
    FOR DELETE USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

-- ------------------------------------------------------------------------------
-- STAFF COMMISSIONS POLICIES
-- Patronlar personellerinin prim kurallarını belirler.
-- Personeller SADECE kendi prim kurallarını "okuyabilir".
-- ------------------------------------------------------------------------------
CREATE POLICY "Patronlar kendi isletmelerindeki prim kurallarini gorebilir" ON public.staff_commissions
    FOR SELECT USING (
        staff_business_id IN (
            SELECT id FROM public.staff_business WHERE business_id IN (
                SELECT business_id FROM public.business_owners WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Patronlar kendi isletmelerine prim kurali ekleyebilir" ON public.staff_commissions
    FOR INSERT WITH CHECK (
        staff_business_id IN (
            SELECT id FROM public.staff_business WHERE business_id IN (
                SELECT business_id FROM public.business_owners WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Patronlar kendi isletmelerindeki prim kurallarini guncelleyebilir" ON public.staff_commissions
    FOR UPDATE USING (
        staff_business_id IN (
            SELECT id FROM public.staff_business WHERE business_id IN (
                SELECT business_id FROM public.business_owners WHERE user_id = auth.uid()
            )
        )
    ) WITH CHECK (
        staff_business_id IN (
            SELECT id FROM public.staff_business WHERE business_id IN (
                SELECT business_id FROM public.business_owners WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Personeller kendi prim kurallarini okuyabilir" ON public.staff_commissions
    FOR SELECT USING (
        staff_business_id IN (
            SELECT id FROM public.staff_business WHERE user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- PAYROLL RECORDS POLICIES
-- Patronlar bordroları yönetir, personeller kendi hakkediş belgelerini okuyabilir.
-- ------------------------------------------------------------------------------
CREATE POLICY "Patronlar kendi isletme bordrolarini gorebilir" ON public.payroll_records
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Patronlar bordro ekleyebilir" ON public.payroll_records
    FOR INSERT WITH CHECK (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Patronlar bordro guncelleyebilir" ON public.payroll_records
    FOR UPDATE USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    ) WITH CHECK (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Personeller kendi bordrolarini okuyabilir" ON public.payroll_records
    FOR SELECT USING (
        staff_business_id IN (
            SELECT id FROM public.staff_business WHERE user_id = auth.uid()
        )
    );
