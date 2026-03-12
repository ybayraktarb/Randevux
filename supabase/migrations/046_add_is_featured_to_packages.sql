-- ============================================================
-- Migration 046: Add is_featured to packages
-- 
-- 1. packages tablosuna is_featured kolonu eklendi (Frontend'den gelen veriyi karsilamak icin).
-- ============================================================

ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
