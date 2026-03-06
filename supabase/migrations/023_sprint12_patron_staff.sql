-- ============================================================
-- Sprint 12 - Patron (İşletme Sahibi) Personel Entegrasyonu
-- ============================================================
-- İşletme sahipleri ("business_owners" tablosu) kendileri için 
-- randevu alabilmeli ve takvimde personeller arasında görünmelidir.
-- Bunun için tüm mevcut işletme sahiplerinin "staff_business" tablosuna
-- otomatik olarak (eğer daha önceden eklenmemişlerse) eklenmesini sağlıyoruz.

-- ────────────────────────────────────────────────────────────
-- 1. MEVCUT İŞLETME SAHİPLERİNİ "staff_business" TABLOSUNA EKLEME
-- ────────────────────────────────────────────────────────────
INSERT INTO staff_business (user_id, business_id, can_set_own_price, can_set_own_duration, created_at)
SELECT 
  bo.user_id, 
  bo.business_id, 
  true AS can_set_own_price, 
  true AS can_set_own_duration,
  now() AS created_at
FROM business_owners bo
WHERE NOT EXISTS (
  -- İlgili patron zaten aynı işletmede bir personel olarak eklenmişse atla
  SELECT 1 
  FROM staff_business sb 
  WHERE sb.user_id = bo.user_id AND sb.business_id = bo.business_id
);

-- Note: İleride "Patron" olarak eklenirken "user.actions.ts" içinde 
-- doğrudan "staff_business" kaydı da atıldığı için patron hem işletme sahibi 
-- hem de çalışan yetkisiyle sistemde yer alacaktır.
