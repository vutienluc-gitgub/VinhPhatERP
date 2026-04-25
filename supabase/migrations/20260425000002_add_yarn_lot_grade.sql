-- Migration: Add lot_no and grade to yarn_catalogs
-- Created at: 2026-04-25

ALTER TABLE public.yarn_catalogs 
ADD COLUMN IF NOT EXISTS lot_no TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT;

-- Ghi chú: Sau khi chạy lệnh này, hãy chạy 'supabase gen types' để cập nhật database.types.ts
