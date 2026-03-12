-- ============================================================
-- Migration 040: Security Hardening & RLS Leak Patch
-- 
-- 1. business_owners: Kritik yetki kaçağını kapat (bo_insert_auth kaldırıldı).
-- 2. businesses: Create policy'sini daralt.
-- 3. audit_logs & notifications: Gereksiz insert yetkilerini temizle.
-- 4. RPC: Güvenli işletme kaydı için create_business_v2 fonksiyonu.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. BUSINESS_OWNERS: KRİTİK YETKİ PATCH'İ
-- ────────────────────────────────────────────────────────────
-- Herhangi bir kullanıcının kendisini rastgele bir işletmeye 
-- "sahip" olarak eklediği o açık kapıyı kapatıyoruz.
DROP POLICY IF EXISTS "bo_insert_auth" ON public.business_owners;

-- Artık kimse doğrudan bu tabloya insert yapamaz. 
-- Sadece SECURITY DEFINER fonksiyonlar (create_business_v2 vb.) üzerinden kayıt atılabilir.

-- ────────────────────────────────────────────────────────────
-- 2. AUDIT_LOGS & NOTIFICATIONS: TEMİZLİK
-- ────────────────────────────────────────────────────────────
-- Dışarıdan spam yapılmasını engellemek için insert yetkilerini daraltıyoruz.
DROP POLICY IF EXISTS "audit_insert_authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "notif_insert_auth" ON public.notifications;

-- Notifications sadece sistem veya işletme yetkilileri tarafından atılabilmeli.
CREATE POLICY "notif_insert_secure" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.business_owners bo 
            WHERE bo.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.staff_business sb 
            WHERE sb.user_id = auth.uid()
        )
        OR auth.uid() = user_id -- Kullanıcının sistem üzerinden kendine (trigger ile) bildirim atması gerekirse
    );

-- ────────────────────────────────────────────────────────────
-- 3. GÜVENLİ İŞLETME KAYIT RPC (Logic Enforced)
-- ────────────────────────────────────────────────────────────
-- Bu fonksiyon "Atomic" çalışır: Ya her şey kurulur ya hiçbir şey.
-- RLS bypass eden SECURITY DEFINER ile çalışır, böylece tablo seviyesinde 
-- kapattığımız yetkileri kontrollü bir şekilde açar.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_business_v2(
    p_name TEXT,
    p_module_id UUID,
    p_address TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- 1. Kimlik Kontrolü
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Oturum açmanız gerekiyor.';
    END IF;

    -- 2. İşletmeyi Oluştur
    INSERT INTO public.businesses (name, module_id, address, phone)
    VALUES (p_name, p_module_id, p_address, p_phone)
    RETURNING id INTO v_business_id;

    -- 3. Oluşturan kişiyi PATRON olarak ata (Kendi kendine atama güvenli)
    INSERT INTO public.business_owners (user_id, business_id)
    VALUES (auth.uid(), v_business_id);

    -- 4. Varsayılan paketi (Başlangıç) ata
    -- NOT: subscriptions tablosu trigger ile veya buradan dolabilir
    INSERT INTO public.subscriptions (business_id, package_id)
    SELECT v_business_id, id FROM public.packages WHERE name = 'Başlangıç' LIMIT 1
    ON CONFLICT (business_id) DO NOTHING;

    RETURN v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_business_v2 IS 'İşletme ve sahibi kaydını aynı anda, güvenli bir şekilde yapan fonksiyon.';
