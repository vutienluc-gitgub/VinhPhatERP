-- Migration: Fix chat_attachments storage RLS policies and bucket MIME types
-- Description: Allow authenticated users to upload and read chat attachments (images, PDF, Excel, Word)

-- 1. Drop old / misconfigured policies on storage.objects
DROP POLICY IF EXISTS "Tenant can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Tenant can read own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat_attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read chat_attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update chat_attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete chat_attachments" ON storage.objects;

-- 2. Create proper Authenticated policies for chat_attachments
CREATE POLICY "Authenticated users can upload chat_attachments" 
  ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'chat_attachments');

CREATE POLICY "Authenticated users can read chat_attachments" 
  ON storage.objects FOR SELECT TO authenticated 
  USING (bucket_id = 'chat_attachments');

CREATE POLICY "Authenticated users can update chat_attachments" 
  ON storage.objects FOR UPDATE TO authenticated 
  USING (bucket_id = 'chat_attachments');

CREATE POLICY "Authenticated users can delete chat_attachments" 
  ON storage.objects FOR DELETE TO authenticated 
  USING (bucket_id = 'chat_attachments');

-- 3. Ensure bucket exists and update allowed mime types & file size limit (10MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_attachments',
  'chat_attachments',
  false,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv'
  ];
