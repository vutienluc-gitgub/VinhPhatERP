import imageCompression from 'browser-image-compression';

import { ImageCompressionOptions } from './types';

const DEFAULT_COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // Compress to max 1MB by default
  maxWidthOrHeight: 1920, // Max dimension 1920px
  useWebWorker: true, // Use web worker for better performance
};

export async function compressImage(
  file: File,
  options?: ImageCompressionOptions,
  onProgress?: (progress: number) => void,
): Promise<File> {
  // If the file is not an image that can be compressed (e.g. svg, gif sometimes), return original
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const compressionOptions = {
    ...DEFAULT_COMPRESSION_OPTIONS,
    ...options,
    onProgress: onProgress,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error('[ImageCompression] Error:', error);
    // If compression fails, we might want to return the original file or throw
    throw new Error('Không thể nén ảnh. Vui lòng thử lại.');
  }
}
