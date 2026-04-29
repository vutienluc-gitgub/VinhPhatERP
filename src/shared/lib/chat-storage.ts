import imageCompression from 'browser-image-compression';

import { supabase } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';

const CHAT_BUCKET = 'chat_attachments';
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  preserveExif: false, // CRITICAL: Strip GPS/EXIF metadata for privacy
  fileType: 'image/jpeg' as const,
};

export interface ChatUploadResult {
  publicUrl: string;
  path: string;
  size: number;
}

/**
 * Validate file before upload.
 * Returns error message or null if valid.
 */
function validateImageFile(file: File): string | null {
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    return `Dinh dang khong hop le. Chi chap nhan: ${ALLOWED_IMAGE_TYPES.join(', ')}`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Hinh anh khong duoc vuot qua ${MAX_SIZE_MB}MB`;
  }
  return null;
}

/**
 * Compress image client-side using browser-image-compression.
 * Strips EXIF/GPS data automatically (preserveExif: false).
 */
async function compressImage(file: File): Promise<File> {
  // Skip compression for small images (< 200KB)
  if (file.size < 200 * 1024) {
    // Still strip EXIF even for small files
    const compressed = await imageCompression(file, {
      ...COMPRESSION_OPTIONS,
      maxSizeMB: MAX_SIZE_MB, // Don't reduce quality for small files
    });
    return compressed;
  }

  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  return compressed;
}

/**
 * Build storage path with tenant isolation.
 * Format: {tenant_id}/{room_id}/{timestamp}_{uuid}.{ext}
 */
function buildStoragePath(
  tenantId: string,
  roomId: string,
  extension: string,
): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  return `${tenantId}/${roomId}/${timestamp}_${uuid}.${extension}`;
}

/**
 * Upload a chat image to Supabase Storage.
 *
 * Pipeline:
 * 1. Validate file type + size
 * 2. Compress image (saves ~70% bandwidth)
 * 3. Strip EXIF/GPS metadata (privacy protection)
 * 4. Upload to chat_attachments bucket
 * 5. Return public URL
 */
export async function uploadChatImage(
  file: File,
  roomId: string,
): Promise<ChatUploadResult> {
  // 1. Validate
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  // 2. Compress + strip EXIF
  const compressed = await compressImage(file);

  // 3. Get Tenant & Build path
  const tenantId = await getTenantId();
  const path = buildStoragePath(tenantId, roomId, 'jpg');

  // 4. Upload
  const { error } = await supabase.storage
    .from(CHAT_BUCKET)
    .upload(path, compressed, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload that bai: ${error.message}`);
  }

  // 5. Get Signed URL (10 years expiration)
  const { data: urlData, error: signError } = await supabase.storage
    .from(CHAT_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 3650);

  if (signError) {
    throw new Error(`Khong the tao Signed URL: ${signError.message}`);
  }

  return {
    publicUrl: urlData.signedUrl,
    path,
    size: compressed.size,
  };
}

/**
 * Upload a PDF file to Supabase Storage (for invoices/documents).
 */
export async function uploadChatPdf(
  file: File,
  roomId: string,
): Promise<ChatUploadResult> {
  if (file.type !== 'application/pdf') {
    throw new Error('Chi chap nhan file PDF');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File PDF khong duoc vuot qua 10MB');
  }

  const tenantId = await getTenantId();
  const path = buildStoragePath(tenantId, roomId, 'pdf');

  const { error } = await supabase.storage
    .from(CHAT_BUCKET)
    .upload(path, file, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload that bai: ${error.message}`);
  }

  const { data: urlData, error: signError } = await supabase.storage
    .from(CHAT_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 3650);

  if (signError) {
    throw new Error(`Khong the tao Signed URL: ${signError.message}`);
  }

  return {
    publicUrl: urlData.signedUrl,
    path,
    size: file.size,
  };
}
