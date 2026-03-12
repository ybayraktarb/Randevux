-- ============================================================
-- Migration 037: Mimari Mantık ve Otomasyon İyileştirmeleri
-- 
-- İyileştirmeler:
--   1. Yeni işletme kaydolduğunda Sektör Varsayılan Özelliklerini otomatik ata.
--   2. Sektör Varsayılan Özellikleri değiştiğinde tüm işletmelere yansıt.
--   3. business_features senkronizasyon fonksiyonunu 'sector_default' desteğiyle güncelle.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SEKTÖR ÖZELLİK SENKRONİZASYON FONKSİYONU
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_business_sector_features(p_business_id UUID, p_sector_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Sektör değişmiş olabilir veya ilk kurulumdur.
    -- Önce o işletmedeki eski 'sector_default' kaynaklı özelliklerini temizle (Sektör bazlı olduğu için)
    DELETE FROM public.business_features 
    WHERE business_id = p_business_id 
      AND source = 'sector_default';

    -- Yeni sektörün varsayılanlarını ekle
    INSERT INTO public.business_features (business_id, feature_id, is_enabled, source)
    SELECT p_business_id, sdf.feature_id, true, 'sector_default'
    FROM public.sector_default_features sdf
    WHERE sdf.sector_id = p_sector_id
    ON CONFLICT (business_id, feature_id) DO UPDATE 
      SET source = 'sector_default', is_enabled = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────
-- 2. BUSINESSES TABLOSU İÇİN TRİGGER GÜNCELLEMESİ
--    Hem paket değişimini hem sektör değişimini yönetmeli.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.process_business_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- SEKÖTR DEĞİŞİMİ VEYA YENİ KAYIT
    IF (TG_OP = 'INSERT') OR (OLD.module_id IS DISTINCT FROM NEW.module_id) THEN
        PERFORM public.sync_business_sector_features(NEW.id, NEW.module_id);
    END IF;

    -- PAKET DEĞİŞİMİ (Zaten 035'teki sync_business_features_on_package_change bunu yapıyor)
    -- Ancak hepsini tek bir akışta toplamak daha temiz olabilir.
    -- Şimdilik 035'teki trigger'ı ezip genişletiyoruz:
    
    IF (TG_OP = 'INSERT' AND NEW.package_id IS NOT NULL) OR 
       (TG_OP = 'UPDATE' AND (OLD.package_id IS DISTINCT FROM NEW.package_id)) THEN
        
        -- Sadece 'package' kaynaklıları sil ve yenilerini ekle
        DELETE FROM public.business_features WHERE business_id = NEW.id AND source = 'package';
        
        IF NEW.package_id IS NOT NULL THEN
            INSERT INTO public.business_features (business_id, feature_id, is_enabled, source)
            SELECT NEW.id, pf.feature_id, true, 'package'
            FROM public.package_features pf
            WHERE pf.package_id = NEW.package_id
            ON CONFLICT (business_id, feature_id) DO UPDATE SET source = 'package', is_enabled = true;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eski trigger'ları kaldırıp tek bir orchestrator trigger kuralım
DROP TRIGGER IF EXISTS trg_sync_features_on_biz_update ON public.businesses;
CREATE TRIGGER trg_sync_features_on_biz_update
  AFTER INSERT OR UPDATE OF package_id, module_id ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.process_business_sync();


-- ────────────────────────────────────────────────────────────
-- 3. SEKTÖR VARSAYILANLARI DEĞİŞTİĞİNDE TÜM İŞLETMELERİ GÜNCELLE
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_businesses_on_sector_features_change()
RETURNS TRIGGER AS $$
DECLARE
    v_sector_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN v_sector_id := OLD.sector_id; ELSE v_sector_id := NEW.sector_id; END IF;

    -- Bu sektöre bağlı tüm işletmeleri "düzenle" diyerek trigger'ı pasifçe tetikle
    UPDATE public.businesses SET id = id WHERE module_id = v_sector_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_biz_on_sdf_change ON public.sector_default_features;
CREATE TRIGGER trg_sync_biz_on_sdf_change
    AFTER INSERT OR UPDATE OR DELETE ON public.sector_default_features
    FOR EACH ROW EXECUTE FUNCTION public.sync_businesses_on_sector_features_change();

-- ────────────────────────────────────────────────────────────
-- 4. ADMİN TABLOLARINI AUDİT LOG SİSTEMİNE DAHİL ET
--    (Sektör silindi, Paket fiyatı değişti vb. tüm işlemler loglanmalı)
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
    -- Modules (Sectors)
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_modules_changes') THEN
        CREATE TRIGGER audit_modules_changes AFTER INSERT OR UPDATE OR DELETE ON public.modules
        FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
    END IF;

    -- Packages
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_packages_changes') THEN
        CREATE TRIGGER audit_packages_changes AFTER INSERT OR UPDATE OR DELETE ON public.packages
        FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
    END IF;

    -- Features
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_features_changes') THEN
        CREATE TRIGGER audit_features_changes AFTER INSERT OR UPDATE OR DELETE ON public.features
        FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
    END IF;

    -- Sector Default Features
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_sector_defaults_changes') THEN
        CREATE TRIGGER audit_sector_defaults_changes AFTER INSERT OR UPDATE OR DELETE ON public.sector_default_features
        FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
    END IF;

    -- Package Features
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_package_features_changes') THEN
        CREATE TRIGGER audit_package_features_changes AFTER INSERT OR UPDATE OR DELETE ON public.package_features
        FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
    END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 5. VERİ TEMİZLİĞİ VE İYİLEŞTİRME
-- ────────────────────────────────────────────────────────────

-- Mevcut 'sector_default' olması gereken kayıtları tespit etmeye çalışalım 
-- (Şu an hepsi 'manual' görünüyor olabilir).
-- Sektöründe varsayılan olup source='manual' olanları 'sector_default'a çekelim.

DO $$
BEGIN
    UPDATE public.business_features bf
    SET source = 'sector_default'
    FROM public.businesses b, public.sector_default_features sdf
    WHERE bf.business_id = b.id
      AND b.module_id = sdf.sector_id
      AND bf.feature_id = sdf.feature_id
      AND bf.source = 'manual';
END $$;

COMMENT ON FUNCTION public.process_business_sync IS 'İşletme kayıt veya güncelleme anında (Sektör/Paket) özellikleri senkronize eder.';
