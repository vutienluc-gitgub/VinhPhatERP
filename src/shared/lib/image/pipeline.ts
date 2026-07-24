import { ImagePipelineOptions } from './types';
import { validateImage } from './validation';
import { compressImage } from './compression';

export type PipelineProgressCallback = (
  step: 'validating' | 'compressing',
  progress?: number,
) => void;

export async function processImage(
  file: File,
  options?: ImagePipelineOptions,
  onProgress?: PipelineProgressCallback,
): Promise<File> {
  // 1. Validation Step
  if (onProgress) {
    onProgress('validating');
  }
  const validationResult = validateImage(file, options?.validation);
  if (!validationResult.valid) {
    throw new Error(validationResult.error);
  }

  // 2. Compression Step
  if (!options?.skipCompression) {
    if (onProgress) {
      onProgress('compressing', 0);
    }
    const compressedFile = await compressImage(
      file,
      options?.compression,
      (progress) => {
        if (onProgress) {
          onProgress('compressing', progress);
        }
      },
    );
    return compressedFile;
  }

  return file;
}
