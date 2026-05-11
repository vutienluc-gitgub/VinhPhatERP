/**
 * Fabric Image Upload API
 *
 * Handles client-side image compression (browser-image-compression)
 * and upload to Supabase Storage (public-media bucket).
 */

import imageCompression from 'browser-image-compression';

import { supabase } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_BUCKET = 'public-media';
const FABRIC_PREFIX = 'fabric';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.2,
  maxWidthOrHeight: 800,
  useWebWorker: true,
  fileType: 'image/webp' as const,
} as const;

// ── Upload ───────────────────────────────────────────────────────────────────

export async function uploadFabricImage(file: File): Promise<string> {
  // 1. Compress on browser → ~200KB WebP
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

  // 2. Build unique storage path
  const tenantId = await getTenantId();
  const uuid = crypto.randomUUID();
  const storagePath = `${tenantId}/${FABRIC_PREFIX}/${uuid}.webp`;

  // 3. Upload to Supabase Storage
  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, compressed, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });
  if (uploadErr) throw uploadErr;

  // 4. Return public URL
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deleteFabricImage(imageUrl: string): Promise<void> {
  const urlObj = new URL(imageUrl);
  const pathSegment = `/object/public/${STORAGE_BUCKET}/`;
  const idx = urlObj.pathname.indexOf(pathSegment);
  if (idx === -1) return;

  const storagePath = urlObj.pathname.slice(idx + pathSegment.length);
  if (!storagePath) return;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);
  if (error) throw error;
}
