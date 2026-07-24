import { ImageValidationOptions } from './types';

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

const DEFAULT_MAX_SIZE_MB = 5;

export function validateImage(
  file: File,
  options?: ImageValidationOptions,
): { valid: boolean; error?: string } {
  const allowedTypes = options?.allowedTypes || DEFAULT_ALLOWED_TYPES;
  const maxSizeMB = options?.maxSizeMB || DEFAULT_MAX_SIZE_MB;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP, HEIC.',
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Kích thước ảnh vượt quá giới hạn cho phép (${maxSizeMB}MB).`,
    };
  }

  return { valid: true };
}
