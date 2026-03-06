-- ============================================================
-- RandevuX — RLS Sıkılaştırma ve RPC Transaction (Migration 016)
-- Sprint 4: Açık (UNRESTRICTED) tabloların RLS kapatılması ve
-- güvenli (race_condition'suz) kullanıcı + personel oluşturma RPC'si.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. EKSİK RLS POLİTİKALARINI ETKİNLEŞTİRME VE POLİTİKA YAZIMI
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_files ENABLE ROW LEVEL SECURITY;

-- 1a. staff_invitations: 
-- İşletme sahipleri, kendi işletmelerindeki davetleri görebilir/yönetebilir.
CREATE POLICY "Owners can manage own business invitations"
  ON public.staff_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_owners
      WHERE business_owners.business_id = staff_invitations.business_id
        AND business_owners.user_id = auth.uid()
    )
  );

-- 1b. staff_services: 
-- Personeller kendi hizmet-fiyatlandırmalarını görebilir/yönetebilir.
-- İşletme sahipleri kendi işletmelerindeki tüm personelin hizmetlerini görebilir.
CREATE POLICY "Staff can view/manage own services"
  ON public.staff_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      WHERE sb.id = staff_services.staff_business_id
        AND sb.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Owners can view/manage staff services in their business"
  ON public.staff_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_business sb
      JOIN public.business_owners bo ON bo.business_id = sb.business_id
      WHERE sb.id = staff_services.staff_business_id
        AND bo.user_id = auth.uid()
    )
  );

-- 1c. assets / appointment_assets / appointment_files (Media & File Management):
-- Şimdilik sadece işletme personelleri ve sahipleri her şeyi okuyup/yazabilsin (MVP level güvence)
CREATE POLICY "Related users can manage business assets"
  ON public.assets FOR ALL
  USING (public.is_related_to_user(auth.uid()));

CREATE POLICY "Related users can manage appointment assets"
  ON public.appointment_assets FOR ALL
  USING (public.is_related_to_user(auth.uid()));
  
CREATE POLICY "Related users can manage appointment files"
  ON public.appointment_files FOR ALL
  USING (public.is_related_to_user(auth.uid()));


-- ────────────────────────────────────────────────────────────
-- 2. GÜVENLİ PERSONEL OLUŞTURMA RPC (Stored Procedure)
-- Bu fonksiyon, frontend'in 3 parçada (Auth -> Profile -> Business)
-- yaptığı işlemi tek ve atomic (geri alınabilir) bir Transaction ile 
-- sunucuda yaparak race-condition ve veritabanı yutma hatalarını kökten çözer.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_staff_user_transaction(
    p_auth_user_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_business_id UUID,
    p_role TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_new_staff_business_id UUID;
BEGIN
    -- 1. ADIM: public.users tablosuna profili ekle/güncelle
    -- Auth Trigger'ın çalışmasını beklemeden kaydı güvene al.
    INSERT INTO public.users (id, email, name, phone, is_active)
    VALUES (p_auth_user_id, p_email, p_name, p_phone, true)
    ON CONFLICT (id) DO UPDATE 
    SET 
        email = EXCLUDED.email,
        name = COALESCE(users.name, EXCLUDED.name),
        phone = COALESCE(users.phone, EXCLUDED.phone),
        is_active = EXCLUDED.is_active;

    -- 2. ADIM: staff_business tablosuna personeli bağla
    INSERT INTO public.staff_business (
        user_id, 
        business_id, 
        role, 
        is_active, 
        can_set_own_price, 
        can_set_own_duration
    )
    VALUES (
        p_auth_user_id,
        p_business_id,
        p_role,
        true,
        false,
        false
    )
    RETURNING id INTO v_new_staff_business_id;

    -- Başarılı dönüş (staff_business ID'sini ve status'u döner)
    RETURN jsonb_build_object(
        'success', true,
        'staff_business_id', v_new_staff_business_id
    );

EXCEPTION
    WHEN unique_violation THEN
        -- Eğer kullanıcı zaten işletmeye ekliyse (UNIQUE_VIOLATION 23505)
        RAISE EXCEPTION 'Bu kullanıcı zaten işletmenizde kayıtlı.';
    WHEN OTHERS THEN
        -- Herhangi başka bir hata olursa Transaction komple geri sarılır (Rollback)
        RAISE EXCEPTION 'Veritabanı hatası: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────
-- 3. GÜVENLİ PATRON OLUŞTURMA RPC (Bonus/Eşdeğer Koruma)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_owner_user_transaction(
    p_auth_user_id UUID,
    p_email TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_business_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_new_business_owner_id UUID;
BEGIN
    -- 1. Profile UPSERT
    INSERT INTO public.users (id, email, name, phone, is_active)
    VALUES (p_auth_user_id, p_email, p_name, p_phone, true)
    ON CONFLICT (id) DO UPDATE 
    SET 
        email = EXCLUDED.email,
        name = COALESCE(users.name, EXCLUDED.name),
        phone = COALESCE(users.phone, EXCLUDED.phone);

    -- 2. Patron bağlaması
    INSERT INTO public.business_owners (user_id, business_id)
    VALUES (p_auth_user_id, p_business_id)
    RETURNING id INTO v_new_business_owner_id;

    RETURN jsonb_build_object(
        'success', true,
        'business_owner_id', v_new_business_owner_id
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Bu kullanıcı zaten bu işletmede patron olarak kayıtlı.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Veritabanı hatası: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ════════════════════════════════════════════════════════════
-- ✅ 016 — STRICT RLS AND RPC TRANSACTION APPLIED SUCCESSFULLY
-- ════════════════════════════════════════════════════════════
