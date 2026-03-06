-- Sprint 5: Aile Profilleri ve Randevu Entegrasyonu

-- 1. Aile Profilleri Tablosu
CREATE TABLE family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT, -- 'Çocuk', 'Eş', 'Ebeveyn' vb.
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Randevu Tablosuna Aile Profili Alanı Ekleme
ALTER TABLE appointments ADD COLUMN family_profile_id UUID REFERENCES family_profiles(id) ON DELETE SET NULL;

-- 3. RLS Politikaları
ALTER TABLE family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own family profiles"
  ON family_profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- Randevu politikasını güncellemeye gerek yok (customer_user_id üzerinden zaten erişiliyor)
-- Ancak işletme sahipleri de aile profilindeki ismi görebilmeli (RPC veya View gerekebilir detay görünümünde)
