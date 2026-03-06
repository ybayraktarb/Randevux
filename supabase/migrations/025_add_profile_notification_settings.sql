-- ============================================================
-- Sprint 2: Profile Notification Settings
-- Migration 025
-- ============================================================

-- Add notification_settings column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"push": true, "email": true, "sms": false}'::JSONB;

-- Update RLS if needed (already enabled, owner can update own profil)
-- Users can already update their own profile from 001_initial_schema.sql
