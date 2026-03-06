-- ==============================================================================
-- SPRINT 7: Ürün, Stok Takibi ve POS Modülü
-- İşletmenin sattığı fiziksel ürünler, stok hareketleri ve randevularda 
-- satılan ürünlerin (POS) veritabanı tabloları.
-- ==============================================================================

-- 1. products (Ürün Kataloğu)
-- İşletmenin sattığı veya kullandığı fiziksel ürünler.
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(50), -- Stok Kodu / Barkod
    category VARCHAR(50), -- Şampuan, Krem, Serum vb.
    purchase_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Alış fiyatı (Maliyet hesabı için)
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Satış fiyatı
    stock_quantity INTEGER NOT NULL DEFAULT 0, -- Mevcut stok miktarı
    min_stock_alert INTEGER NOT NULL DEFAULT 5, -- Bu miktarın altına düşünce uyarı verilsin
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_business ON public.products(business_id);
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- 2. inventory_logs (Stok Hareket / Denetim Defteri)
-- Stoğa giriş veya çıkış yapıldığında loglanır (Audit trail).
CREATE TABLE public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE, -- Güvenlik için denormalize
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('addition', 'reduction', 'sale', 'adjustment', 'return')),
    quantity_changed INTEGER NOT NULL, -- (+ veya - olabilir)
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_logs_product ON public.inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_business ON public.inventory_logs(business_id);


-- 3. appointment_products (Adisyona Eklenen Satışlar / POS)
-- Randevu esnasında satılan ürünleri ve kimin (hangi personelin) sattığını tutar.
CREATE TABLE public.appointment_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_snapshot DECIMAL(10, 2) NOT NULL, -- Satış anındaki fiyat
    sold_by_staff_id UUID REFERENCES public.staff_business(id) ON DELETE SET NULL, -- Hangi personel sattı (Çapraz satış primi için)
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_apt_products_appointment ON public.appointment_products(appointment_id);

-- ==============================================================================
-- RLS (Row Level Security) POLICIES
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_products ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PRODUCTS POLICIES
-- Patronlar tam yetkili, personeller okuyabilir.
-- ------------------------------------------------------------------------------
CREATE POLICY "Patronlar kendi isletme urunlerini tam yetki yonetir" ON public.products
    FOR ALL USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Personeller isletme urunlerini okuyabilir" ON public.products
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM public.staff_business WHERE user_id = auth.uid())
    );

-- ------------------------------------------------------------------------------
-- INVENTORY LOGS POLICIES
-- Patronlar görebilir ve (dolaylı) ekleyebilir.
-- ------------------------------------------------------------------------------
CREATE POLICY "Patronlar envanter kayitlarini gorebilir" ON public.inventory_logs
    FOR SELECT USING (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

CREATE POLICY "Patronlar envanter kaydi ekleyebilir" ON public.inventory_logs
    FOR INSERT WITH CHECK (
        business_id IN (SELECT business_id FROM public.business_owners WHERE user_id = auth.uid())
    );

-- Personeller de stok ekleme/düşürme yetkisine sahip olabilir (Opsiyonel ama genelde ürün sattıkları için gerekir)
CREATE POLICY "Personeller envanter kaydi ekleyebilir" ON public.inventory_logs
    FOR INSERT WITH CHECK (
        business_id IN (SELECT business_id FROM public.staff_business WHERE user_id = auth.uid())
    );

-- ------------------------------------------------------------------------------
-- APPOINTMENT PRODUCTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Patronlar adisyon urunlerini gorebilir" ON public.appointment_products
    FOR SELECT USING (
        appointment_id IN (
            SELECT id FROM public.appointments WHERE business_id IN (
                SELECT business_id FROM public.business_owners WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Patronlar adisyon urunu ekleyebilir" ON public.appointment_products
    FOR ALL USING (
        appointment_id IN (
            SELECT id FROM public.appointments WHERE business_id IN (
                SELECT business_id FROM public.business_owners WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Personeller adisyon urunlerini gorebilir ve ekleyebilir" ON public.appointment_products
    FOR ALL USING (
        appointment_id IN (
            SELECT id FROM public.appointments WHERE business_id IN (
                SELECT business_id FROM public.staff_business WHERE user_id = auth.uid()
            )
        )
    );
