-- ============================================================
-- RandevuX — RLS Optimizasyonu (Migration 015)
-- Sprint 3: users_select_business_related politikasının
-- derin EXISTS sorguları yerine hızlı SECURITY DEFINER
-- yardımcı fonksiyonlarla yeniden yazılması.
-- ============================================================
-- Sorun: 003_fix_missing_rls.sql'deki users_select_business_related
-- politikası, her SELECT çağrısında 3 katmanlı iç içe EXISTS sorgusu
-- çalıştırıyordu. Yeni eklenen personel bu sorgunun transaction
-- izolasyon sınırını geçememesi durumunda listede görünmez oluyordu.
--
-- Çözüm: Tek bir SECURITY DEFINER fonksiyon içinde handle edilen,
-- index-friendly sorgular ile daha hızlı ve daha güvenilir kontrol.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- YARDIMCI FONKSİYON: is_related_to_user
-- Mevcut oturumun (auth.uid()), hedef kullanıcıyla (target_user_id)
-- işletme bağı olup olmadığını kontrol eder.
-- SECURITY DEFINER: RLS bypass ile çalışır — iç sorgular RLS'den etkilenmez.
-- STABLE: Aynı transaction içinde sonuç cache'lenir — performans artışı.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_related_to_user(_target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    _caller_id UUID := auth.uid();
BEGIN
    -- Kendi profilini her zaman görebilir
    IF _caller_id = _target_user_id THEN
        RETURN TRUE;
    END IF;

    -- Patron: Kendi işletmesindeki personeli ya da müşteriyi görebilir
    IF EXISTS (
        SELECT 1 FROM business_owners bo
        WHERE bo.user_id = _caller_id
          AND (
              EXISTS (SELECT 1 FROM staff_business sb
                      WHERE sb.business_id = bo.business_id
                        AND sb.user_id = _target_user_id)
              OR
              EXISTS (SELECT 1 FROM business_customers bc
                      WHERE bc.business_id = bo.business_id
                        AND bc.user_id = _target_user_id)
          )
    ) THEN
        RETURN TRUE;
    END IF;

    -- Personel: Aynı aktif işletmedeki başka personeli ya da müşteriyi görebilir
    IF EXISTS (
        SELECT 1 FROM staff_business my_sb
        WHERE my_sb.user_id = _caller_id
          AND my_sb.is_active = TRUE
          AND (
              EXISTS (SELECT 1 FROM staff_business other_sb
                      WHERE other_sb.business_id = my_sb.business_id
                        AND other_sb.user_id = _target_user_id)
              OR
              EXISTS (SELECT 1 FROM business_customers bc
                      WHERE bc.business_id = my_sb.business_id
                        AND bc.user_id = _target_user_id)
          )
    ) THEN
        RETURN TRUE;
    END IF;

    -- Müşteri: Randevu aldığı personeli görebilir
    IF EXISTS (
        SELECT 1 FROM appointments a
        JOIN staff_business sb ON sb.id = a.staff_business_id
        WHERE a.customer_user_id = _caller_id
          AND sb.user_id = _target_user_id
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ────────────────────────────────────────────────────────────
-- ESKİ POLİTİKAYI KALDIR VE YENİSİYLE DEĞİŞTİR
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_select_business_related" ON users;

CREATE POLICY "users_select_business_related"
  ON users FOR SELECT
  USING (is_related_to_user(id));


-- ════════════════════════════════════════════════════════════
-- ✅ 015 — RLS OPTIMIZATION APPLIED SUCCESSFULLY
-- ════════════════════════════════════════════════════════════
