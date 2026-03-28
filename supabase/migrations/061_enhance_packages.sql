-- Enhance packages with image_url for the landing page showcase
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS image_url text;
