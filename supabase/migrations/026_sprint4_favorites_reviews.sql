-- Sprint 4: Favoriler ve Değerlendirmeler

-- 1. Favoriler Tablosu
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- 2. Değerlendirmeler (Reviews) Tablosu
CREATE TABLE business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Politikaları
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;

-- Favoriler: Kullanıcı sadece kendi favorilerini görebilir ve yönetebilir
CREATE POLICY "Users can manage their own favorites"
  ON user_favorites
  FOR ALL
  USING (auth.uid() = user_id);

-- Değerlendirmeler: Herkes görebilir, sadece kullanıcı kendi yazdığını silebilir/düzenleyebilir
CREATE POLICY "Anyone can view reviews"
  ON business_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own reviews"
  ON business_reviews
  FOR ALL
  USING (auth.uid() = user_id);
