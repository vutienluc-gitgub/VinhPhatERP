-- Migration: Create Storage Buckets and Policies for Media Manager
-- Run this to initialize Supabase Storage buckets for the new media module.

-- 1. Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-media', 'public-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('secure-media', 'secure-media', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Objects Policies
-- Public Media Bucket
CREATE POLICY "Authenticated users can upload public-media" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'public-media');

CREATE POLICY "Authenticated users can update public-media" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'public-media');

CREATE POLICY "Authenticated users can delete public-media" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'public-media');

CREATE POLICY "Anyone can read public-media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'public-media');

-- Secure Media Bucket
CREATE POLICY "Authenticated users can upload secure-media" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'secure-media');

CREATE POLICY "Authenticated users can update secure-media" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'secure-media');

CREATE POLICY "Authenticated users can delete secure-media" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'secure-media');

CREATE POLICY "Authenticated users can read secure-media" 
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'secure-media');
