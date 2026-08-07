-- Migration: Add email column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS email text;
