-- ============================================================
-- RandevuX — Storage & Realtime (Migration 004)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. STORAGE BUCKETS
-- ────────────────────────────────────────────────────────────

-- 'avatars' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 'business_logos' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('business_logos', 'business_logos', true)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. STORAGE RLS POLICIES
-- ────────────────────────────────────────────────────────────

-- Avatars Policies
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
CREATE POLICY "Public avatars are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);


-- Business Logos Policies
DROP POLICY IF EXISTS "Public logos are viewable by everyone" ON storage.objects;
CREATE POLICY "Public logos are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business_logos');

DROP POLICY IF EXISTS "Authenticated users can upload business logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload business logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business_logos' AND auth.uid() IS NOT NULL AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can update their uploaded logos" ON storage.objects;
CREATE POLICY "Users can update their uploaded logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'business_logos' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their uploaded logos" ON storage.objects;
CREATE POLICY "Users can delete their uploaded logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'business_logos' AND auth.uid() = owner);


-- ────────────────────────────────────────────────────────────
-- 3. REALTIME İÇİN APPOINTMENTS TABLOSUNU AKTİFLEŞTİRME
-- ────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- supabase_realtime publication yoksa oluştur
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  -- appointments tablosunu realtime yayınına ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments' AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  END IF;
END $$;
