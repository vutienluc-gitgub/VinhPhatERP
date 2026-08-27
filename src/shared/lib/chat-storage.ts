import imageCompression from 'browser-image-compression';

import { supabase } from '@/services/supabase/client';
import { getTenantId } from '@/services/supabase/tenant';

const CHAT_BUCKET = 'chat_attachments';
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'Word',
};

const FILE_MAX_SIZE_MB = 10;
const FILE_MAX_SIZE_BYTES = FILE_MAX_SIZE_MB * 1024 * 1024;

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
  fileName: string;
  fileType: string;
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
    fileName: file.name,
    fileType: 'image/jpeg',
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
    fileName: file.name,
    fileType: file.type,
  };
}

/**
 * Upload a generic file (PDF, Excel, Word) to Supabase Storage.
 */
export async function uploadChatFile(
  file: File,
  roomId: string,
): Promise<ChatUploadResult> {
  if (
    !ALLOWED_FILE_TYPES.includes(
      file.type as (typeof ALLOWED_FILE_TYPES)[number],
    )
  ) {
    throw new Error(
      `Dinh dang khong hop le. Chi chap nhan: ${ALLOWED_FILE_TYPES.join(', ')}`,
    );
  }

  if (file.size > FILE_MAX_SIZE_BYTES) {
    throw new Error(`File khong duoc vuot qua ${FILE_MAX_SIZE_MB}MB`);
  }

  const extension = file.name.split('.').pop() ?? 'bin';
  const tenantId = await getTenantId();
  const path = buildStoragePath(tenantId, roomId, extension);

  const { error } = await supabase.storage
    .from(CHAT_BUCKET)
    .upload(path, file, {
      contentType: file.type,
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
    fileName: file.name,
    fileType: file.type,
  };
}

/**
 * Get file type label for display.
 */
export function getFileTypeLabel(fileType: string): string {
  return FILE_TYPE_LABELS[fileType] || 'File';
}

/**
 * Generates an optimized thumbnail URL using Supabase Storage Image Transformation CDN.
 * Reduces bandwidth and memory usage by up to 90% for in-stream message bubbles.
 */
export function getChatThumbnailUrl(
  url: string | null | undefined,
  width = 400,
  height = 400,
): string {
  if (!url) return '';
  if (
    url.includes('/storage/v1/object/public/') ||
    url.includes('/storage/v1/object/sign/')
  ) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&height=${height}&resize=cover`;
  }
  return url;
}
