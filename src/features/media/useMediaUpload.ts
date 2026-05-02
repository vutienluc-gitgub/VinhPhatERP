/**
 * Media Manager — Upload Hook
 *
 * Manages batch file uploads with progress tracking.
 * Uploads directly to Supabase Storage (no API route proxy).
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useTenant } from '@/shared/hooks/useTenant';
import { useAuth } from '@/shared/hooks/useAuth';

import {
  MEDIA_LABELS,
  MEDIA_MESSAGES,
  MEDIA_LIMITS,
  MEDIA_QUERY_KEYS,
} from './media.constants';
import type { UploadProgress } from './media.types';
import { uploadFile } from './media.service';

export function useMediaUpload(folderId: string | null) {
  const { data: tenant } = useTenant();
  const tenantId = tenant?.id;
  const { user } = useAuth();
  const qc = useQueryClient();

  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const updateUpload = useCallback(
    (fileName: string, patch: Partial<UploadProgress>) => {
      setUploads((prev) =>
        prev.map((u) => (u.fileName === fileName ? { ...u, ...patch } : u)),
      );
    },
    [],
  );

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (!user || !tenantId) return;

      // Validate batch size
      if (files.length > MEDIA_LIMITS.MAX_BATCH_FILES) {
        toast.error(MEDIA_MESSAGES.BATCH_LIMIT);
        return;
      }

      // Initialize progress state
      const progressList: UploadProgress[] = files.map((f) => ({
        fileName: f.name,
        progress: 0,
        status: 'pending',
      }));
      setUploads(progressList);
      setIsUploading(true);

      let successCount = 0;

      for (const file of files) {
        // Validate file size
        if (file.size > MEDIA_LIMITS.MAX_FILE_SIZE_BYTES) {
          updateUpload(file.name, {
            status: 'error',
            error: MEDIA_MESSAGES.FILE_TOO_LARGE,
          });
          continue;
        }

        updateUpload(file.name, { status: 'uploading', progress: 30 });

        try {
          await uploadFile(file, tenantId, user.id, folderId, true);
          updateUpload(file.name, { status: 'done', progress: 100 });
          successCount++;
        } catch (err) {
          const errObj = err as Record<string, unknown>;
          const message =
            typeof errObj?.message === 'string'
              ? errObj.message
              : err instanceof Error
                ? err.message
                : String(err);
          updateUpload(file.name, { status: 'error', error: message });
        }
      }

      // Invalidate queries to show new files
      await qc.invalidateQueries({ queryKey: [MEDIA_QUERY_KEYS.ASSETS] });

      setIsUploading(false);

      if (successCount > 0) {
        toast.success(
          `${MEDIA_LABELS.UPLOAD_SUCCESS} (${successCount}/${files.length})`,
        );
      }

      // Clear upload progress after delay
      setTimeout(() => setUploads([]), 3000);
    },
    [tenantId, user, folderId, qc, updateUpload],
  );

  const clearUploads = useCallback(() => setUploads([]), []);

  return {
    uploads,
    isUploading,
    handleUpload,
    clearUploads,
  };
}
