import { serverSupabase } from '../db/supabase.js';

export interface UploadSlipImageParams {
  fileBytes: Buffer;
  mimeType: string;
  imageHash: string;
  fileName?: string;
  tenantId?: string | null;
}

export class SlipStorageService {
  private primaryBucket = 'yarn-slips';
  private fallbackBucket = 'public-media';

  private resolveExtension(mimeType: string, fileName?: string): string {
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    if (fileName && fileName.includes('.')) {
      const parts = fileName.split('.');
      const last = parts[parts.length - 1]?.toLowerCase();
      if (last && ['jpg', 'jpeg', 'png', 'webp'].includes(last)) {
        return last === 'jpeg' ? 'jpg' : last;
      }
    }
    return 'jpg';
  }

  /**
   * Uploads a yarn slip image to Supabase Storage with content-addressable path.
   * If the primary bucket 'yarn-slips' fails, attempts fallback to 'public-media'.
   * Non-blocking graceful degradation: returns null on failure so OCR workflow continues.
   */
  async uploadSlipImage(params: UploadSlipImageParams): Promise<{
    publicUrl: string;
    bucket: string;
    storagePath: string;
  } | null> {
    const { fileBytes, mimeType, imageHash, fileName, tenantId } = params;
    const ext = this.resolveExtension(mimeType, fileName);
    const prefix = tenantId ? `${tenantId}/` : '';
    const storagePath = `${prefix}${imageHash}.${ext}`;

    // 1. Try uploading to primary bucket: 'yarn-slips'
    try {
      const { error: primaryError } = await serverSupabase.storage
        .from(this.primaryBucket)
        .upload(storagePath, fileBytes, {
          contentType: mimeType || 'image/jpeg',
          upsert: true,
        });

      if (!primaryError) {
        const bucketRef = serverSupabase.storage.from(this.primaryBucket);
        let secureUrl = bucketRef.getPublicUrl(storagePath).data.publicUrl;

        // Create signed URL (valid for 7 days) since yarn-slips is a private bucket
        if (typeof bucketRef.createSignedUrl === 'function') {
          const { data: signedData } = await bucketRef.createSignedUrl(
            storagePath,
            60 * 60 * 24 * 7,
          );
          if (signedData?.signedUrl) {
            secureUrl = signedData.signedUrl;
          }
        }

        return {
          publicUrl: secureUrl,
          bucket: this.primaryBucket,
          storagePath,
        };
      }

      // Log and attempt fallback
      // eslint-disable-next-line no-console
      console.warn(
        `[SlipStorage] Primary bucket '${this.primaryBucket}' failed (${primaryError.message}). Attempting fallback.`,
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `[SlipStorage] Exception uploading to '${this.primaryBucket}':`,
        err,
      );
    }

    // 2. Fallback to 'public-media' bucket under 'yarn-slips/' prefix
    try {
      const fallbackPath = `yarn-slips/${storagePath}`;
      const { error: fallbackError } = await serverSupabase.storage
        .from(this.fallbackBucket)
        .upload(fallbackPath, fileBytes, {
          contentType: mimeType || 'image/jpeg',
          upsert: true,
        });

      if (!fallbackError) {
        const { data } = serverSupabase.storage
          .from(this.fallbackBucket)
          .getPublicUrl(fallbackPath);
        return {
          publicUrl: data.publicUrl,
          bucket: this.fallbackBucket,
          storagePath: fallbackPath,
        };
      }

      // eslint-disable-next-line no-console
      console.warn(
        `[SlipStorage] Fallback bucket '${this.fallbackBucket}' failed: ${fallbackError.message}`,
      );
    } catch (fallbackEx) {
      // eslint-disable-next-line no-console
      console.warn(
        `[SlipStorage] Exception uploading to '${this.fallbackBucket}':`,
        fallbackEx,
      );
    }

    // Graceful degradation: return null if storage unavailable
    return null;
  }
}

export const slipStorage = new SlipStorageService();
