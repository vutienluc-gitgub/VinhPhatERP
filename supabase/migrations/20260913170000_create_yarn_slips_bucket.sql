-- Migration: Create Storage Bucket for Yarn Weighing Slips (FEAT-YARN-OCR)
-- Bucket: yarn-slips (Public read for authenticated ERP viewers, 15MB file limit, JPG/PNG/WebP)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'yarn-slips',
  'yarn-slips',
  true,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for yarn-slips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload yarn-slips'
  ) THEN
    CREATE POLICY "Authenticated users can upload yarn-slips" 
    ON storage.objects FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'yarn-slips');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update yarn-slips'
  ) THEN
    CREATE POLICY "Authenticated users can update yarn-slips" 
    ON storage.objects FOR UPDATE TO authenticated 
    USING (bucket_id = 'yarn-slips');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can read yarn-slips'
  ) THEN
    CREATE POLICY "Anyone can read yarn-slips" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'yarn-slips');
  END IF;
END $$;
