import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { supabase } from '@/services/supabase/client';
import {
  computeEvidenceHash,
  type EPODEvidenceAsset,
  type ReceiverIdentity,
} from '@/domain/logistics';
import { submitDeliveryEPOD } from '@/features/driver-portal/api/delivery-execution.api';
import { enqueueOfflineCommand } from '@/features/driver-portal/services/offline-command-queue';

export interface SubmitEPODInput {
  attemptId: string;
  expectedState?: 'arrived';
  receiver: ReceiverIdentity;
  signatureDataUrl?: string;
  photoFiles?: File[];
  telemetry?: {
    lat: number;
    lng: number;
    accuracy_meters?: number;
    device_id: string;
  };
}

/**
 * Computes SHA-256 of an ArrayBuffer.
 */
async function bufferToSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compresses an image File to WebP with target max dimensions and quality.
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82,
): Promise<{ blob: Blob; contentHash: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Không thể nén ảnh'));
            return;
          }
          const buffer = await blob.arrayBuffer();
          const hash = await bufferToSha256(buffer);
          resolve({ blob, contentHash: hash });
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    img.src = url;
  });
}

/**
 * Uploads blob asset to Supabase storage bucket 'epod-evidence'.
 */
async function uploadEvidenceBlob(
  blob: Blob,
  path: string,
  contentType: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('epod-evidence')
    .upload(path, blob, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload bằng chứng thất bại: ${error.message}`);
  }

  return data.path;
}

export function useEPODSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitEPODInput) => {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const assets: Array<Omit<EPODEvidenceAsset, 'id'>> = [];
      const nowIso = new Date().toISOString();
      const deviceId = input.telemetry?.device_id ?? 'mobile-driver-device';
      const lat = input.telemetry?.lat ?? 0;
      const lng = input.telemetry?.lng ?? 0;

      // 1. Process Signature Asset if present
      if (input.signatureDataUrl) {
        const response = await fetch(input.signatureDataUrl);
        const sigBlob = await response.blob();
        const sigBuffer = await sigBlob.arrayBuffer();
        const sigHash = await bufferToSha256(sigBuffer);
        const sigPath = `signatures/${input.attemptId}_sig_${Date.now()}.png`;

        if (!isOffline) {
          await uploadEvidenceBlob(sigBlob, sigPath, 'image/png');
        }

        assets.push({
          assetType: 'electronic_signature',
          storagePath: sigPath,
          fileSizeBytes: sigBlob.size,
          mimeType: 'image/png',
          contentHash: sigHash,
          capturedAt: nowIso,
          telemetryLat: lat,
          telemetryLng: lng,
        });
      }

      // 2. Process Photo Assets
      if (input.photoFiles && input.photoFiles.length > 0) {
        for (let i = 0; i < input.photoFiles.length; i++) {
          const file = input.photoFiles[i];
          if (!file) continue;
          const { blob, contentHash } = await compressImageToWebP(file);
          const photoPath = `photos/${input.attemptId}_photo_${i}_${Date.now()}.webp`;

          if (!isOffline) {
            await uploadEvidenceBlob(blob, photoPath, 'image/webp');
          }

          assets.push({
            assetType: i === 0 ? 'goods_overview' : 'roll_label',
            storagePath: photoPath,
            fileSizeBytes: blob.size,
            mimeType: 'image/webp',
            contentHash,
            capturedAt: nowIso,
            telemetryLat: lat,
            telemetryLng: lng,
          });
        }
      }

      // 3. Compute Deterministic Evidence Hash Chain
      const evidenceHash = await computeEvidenceHash({
        attemptId: input.attemptId,
        receiver: input.receiver,
        latitude: lat,
        longitude: lng,
        deviceId,
        submittedAt: nowIso,
        assets: assets.map((a) => ({
          assetType: a.assetType,
          storagePath: a.storagePath,
          contentHash: a.contentHash,
        })),
        previousEvidenceHash: null,
      });

      const commandId = crypto.randomUUID();

      // 4. Handle Offline Enqueue
      if (isOffline) {
        await enqueueOfflineCommand({
          commandId,
          aggregateId: input.attemptId,
          commandName: 'submit_delivery_epod',
          payload: {
            commandId,
            attemptId: input.attemptId,
            expectedState: input.expectedState ?? 'arrived',
            receiver: input.receiver,
            telemetry: {
              lat,
              lng,
              accuracy_meters: input.telemetry?.accuracy_meters,
              device_id: deviceId,
            },
            evidenceHash,
            assets,
          },
        });

        return {
          ok: true,
          attempt_id: input.attemptId,
          evidence_id: 'offline-pending',
          evidence_hash: evidenceHash,
          status: 'delivered',
          submitted_at: nowIso,
          isOffline: true,
        };
      }

      const res = await submitDeliveryEPOD({
        commandId,
        attemptId: input.attemptId,
        expectedState: input.expectedState ?? 'arrived',
        receiver: input.receiver,
        telemetry: {
          lat,
          lng,
          accuracy_meters: input.telemetry?.accuracy_meters,
          device_id: deviceId,
        },
        evidenceHash,
        assets,
      });

      return { ...res, isOffline: false };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-stops'] });
      queryClient.invalidateQueries({ queryKey: ['journey-logs'] });

      if (data?.isOffline) {
        toast.success(
          'Đã lưu bằng chứng giao hàng (Offline). Sẽ tải lên khi có mạng!',
        );
      } else {
        toast.success('Giao hàng & Ký nhận ePOD thành công!');
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Có lỗi khi nộp bằng chứng ePOD',
      );
    },
  });
}
