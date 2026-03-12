-- ============================================================
-- 🛠️ E2E RESET SCRIPT (FIXED VERSION)
-- ============================================================
-- 
-- Bu script sistemi "Super Admin"ler hariç sıfırlar.
-- Tablo isimleri ve bağımlılıklar (FK) kontrol edilerek düzeltilmiştir.
-- ============================================================

DO $$ 
DECLARE 
    sa_count integer;
BEGIN
    -- 1. Güvenlik Kontrolü: Kaç tane Super Admin var?
    SELECT count(*) INTO sa_count FROM public.users WHERE global_role = 'super_admin';
    
    IF sa_count = 0 THEN
        RAISE EXCEPTION 'HATA: Hiç Super Admin bulunamadı! Temizlik durduruldu.';
    END IF;

    -- 2. SIRALI SİLME (FK hatalarını önlemek için en alt tablodan başlıyoruz)
    -- Bu yöntem TRUNCATE'den daha güvenlidir (izin sorunları yaşatmaz).
    
    DELETE FROM public.appointment_services;
    DELETE FROM public.appointments;
    DELETE FROM public.staff_services;
    DELETE FROM public.staff_business;
    DELETE FROM public.business_owners;
    DELETE FROM public.business_customers;
    DELETE FROM public.business_hours;
    DELETE FROM public.services;
    
    -- Eğer bu tablolar varsa sil, yoksa hata alma (IF EXISTS benzeri mantık)
    BEGIN
        DELETE FROM public.inventory;
    EXCEPTION WHEN undefined_table THEN NULL; END;
    
    BEGIN
        DELETE FROM public.announcements;
    EXCEPTION WHEN undefined_table THEN NULL; END;

    -- Ana tabloyu sil
    DELETE FROM public.businesses;

    -- 3. TEST KULLANICILARINI SİL (Sadece super_admin olmayanları auth.users'dan uçuruyoruz)
    -- auth.users'dan silmek public.users tablosundaki yansımalarını da cascade ile silecektir.
    DELETE FROM auth.users 
    WHERE id NOT IN (
        SELECT id FROM public.users WHERE global_role = 'super_admin'
    );

    RAISE NOTICE 'Sistem başarıyla temizlendi: % adet Super Admin korundu.', sa_count;
END $$;
