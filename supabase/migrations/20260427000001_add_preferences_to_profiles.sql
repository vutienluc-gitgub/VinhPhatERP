-- Migration: Add preferences JSONB column to profiles
-- Purpose: Store per-user UI preferences (theme, layout, sidebar state) in DB
--          instead of localStorage, so settings persist across devices/sessions.
-- Idempotent: safe to run multiple times

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.preferences IS
  'Per-user UI preferences: theme, fluid_layout, sidebar_collapsed, etc.';
