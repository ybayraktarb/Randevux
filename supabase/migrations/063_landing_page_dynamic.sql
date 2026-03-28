-- ============================================================
-- Migration 063 — Landing Page Dynamic Fields
-- Mevcut landing_settings tablosuna eksik alanlar ekleniyor.
-- Tablo + RLS 060_landing_page_settings.sql'de zaten oluşturulmuş.
-- ============================================================

-- Hero
ALTER TABLE public.landing_settings
  ADD COLUMN IF NOT EXISTS hero_cta_text text DEFAULT 'Hemen Ücretsiz Başlayın';

-- About (genişletilmiş yapı)
ALTER TABLE public.landing_settings
  ADD COLUMN IF NOT EXISTS about_title text DEFAULT 'Hakkımızda',
  ADD COLUMN IF NOT EXISTS about_subtitle text DEFAULT 'Randesk olarak işletmelerin randevu yönetimini dijitalleştiriyoruz.',
  ADD COLUMN IF NOT EXISTS about_vision_title text DEFAULT 'Vizyonumuz',
  ADD COLUMN IF NOT EXISTS about_vision_description text DEFAULT 'Türkiye''nin lider randevu yönetim platformu olarak, her ölçekte işletmenin dijital dönüşümüne öncülük etmek.',
  ADD COLUMN IF NOT EXISTS about_mission_title text DEFAULT 'Misyonumuz',
  ADD COLUMN IF NOT EXISTS about_mission_description text DEFAULT 'İşletmelerin müşteri ilişkilerini güçlendirmelerine yardımcı olmak, zaman kayıplarını en aza indirmek ve verimliliği artırmak.',
  ADD COLUMN IF NOT EXISTS about_story text DEFAULT '2020 yılında küçük bir girişim olarak yola çıktık. Bugün 10.000''den fazla işletme Randesk ile randevularını yönetiyor.',
  ADD COLUMN IF NOT EXISTS about_image_url text DEFAULT 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop';

-- Contact
ALTER TABLE public.landing_settings
  ADD COLUMN IF NOT EXISTS contact_title text DEFAULT 'İletişim',
  ADD COLUMN IF NOT EXISTS contact_subtitle text DEFAULT 'Sorularınız mı var? Ekibimiz size yardımcı olmaktan mutluluk duyar.',
  ADD COLUMN IF NOT EXISTS contact_form_labels jsonb DEFAULT '{
    "name": "Ad Soyad",
    "email": "E-posta",
    "subject": "Konu",
    "message": "Mesajınız",
    "submit": "Mesaj Gönder"
  }'::jsonb;

-- Pricing section başlıkları (opsiyonel ileride kullanım için)
ALTER TABLE public.landing_settings
  ADD COLUMN IF NOT EXISTS pricing_title text DEFAULT 'Size Uygun Planı Seçin',
  ADD COLUMN IF NOT EXISTS pricing_subtitle text DEFAULT 'Her ölçekte işletme için esnek fiyatlandırma seçenekleri.';

-- Mevcut about_image_url & about_content zaten var; 
-- Yeni about_image_url için satırın NULL kalmaması sağlanır
UPDATE public.landing_settings
SET
  about_image_url = COALESCE(about_image_url, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop'),
  hero_image_url = COALESCE(hero_image_url, 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop')
WHERE id = 1;

-- Mevcut verilerde RandevuX vs kalmışsa Randesk ile değiştirilir.
UPDATE public.landing_settings
SET
  about_subtitle = REPLACE(about_subtitle, 'RandevuX', 'Randesk'),
  about_story = REPLACE(about_story, 'RandevuX', 'Randesk'),
  hero_subtitle = REPLACE(hero_subtitle, 'RandevuX', 'Randesk')
WHERE id = 1;
