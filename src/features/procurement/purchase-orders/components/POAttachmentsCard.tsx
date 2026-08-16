import { useCallback, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  Icon,
  Button,
  MediaLibraryModal,
  type MediaItem,
} from '@/shared/components';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';
// eslint-disable-next-line boundaries/dependencies
import { fetchAssets, uploadFile } from '@/features/media/media.service';
import { useTenant } from '@/shared/hooks/useTenant';
import { useAuth } from '@/shared/hooks/useAuth';
import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
// eslint-disable-next-line boundaries/dependencies
import type { MediaAsset } from '@/features/media/media.types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isValidMimeType(file: File): boolean {
  return PO_CONSTANTS.UPLOAD_ACCEPTED_MIMES.includes(file.type);
}

function mapAssetToMediaItem(asset: MediaAsset): MediaItem {
  return {
    id: asset.id,
    imageUrl: asset.public_url || asset.storage_path,
    title: asset.original_name,
    subtitle: `${PO_CONSTANTS.LABEL_FILE_SIZE}: ${(asset.size_bytes / 1024).toFixed(1)} KB`,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface POAttachmentsCardProps {
  form: UseFormReturn<PurchaseOrderFormValues>;
}

export function POAttachmentsCard({ form }: POAttachmentsCardProps) {
  const { watch, setValue } = form;
  const attachments = watch('attachments') || [];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { data: tenant } = useTenant();
  const { user } = useAuth();

  const handleUploadClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !tenant || !user) return;

      setIsUploading(true);
      let successCount = 0;

      try {
        for (const file of Array.from(files)) {
          // Validate file size
          if (file.size > PO_CONSTANTS.UPLOAD_MAX_SIZE_BYTES) {
            toast.error(`${file.name}: ${PO_CONSTANTS.UPLOAD_FILE_TOO_LARGE}`);
            continue;
          }

          // Validate file type
          if (!isValidMimeType(file)) {
            toast.error(`${file.name}: ${PO_CONSTANTS.UPLOAD_INVALID_TYPE}`);
            continue;
          }

          try {
            const result = await uploadFile(
              file,
              tenant.id,
              user.id,
              null,
              true,
            );
            const url = result.publicUrl ?? result.asset.storage_path;

            setValue(
              'attachments',
              [...(form.getValues('attachments') || []), url],
              { shouldDirty: true },
            );
            successCount++;
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error(`${file.name}: ${message}`);
          }
        }

        if (successCount > 0) {
          toast.success(
            `${PO_CONSTANTS.UPLOAD_SUCCESS} (${successCount}/${files.length})`,
          );
        }
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    },
    [tenant, user, setValue, form],
  );

  const handleSelectFromLibrary = (item: MediaItem) => {
    if (!attachments.includes(item.imageUrl)) {
      setValue('attachments', [...attachments, item.imageUrl], {
        shouldDirty: true,
      });
    }
  };

  const removeAttachment = (url: string) => {
    setValue(
      'attachments',
      attachments.filter((u) => u !== url),
      { shouldDirty: true },
    );
  };

  const fetchMediaItems = useCallback(async (): Promise<MediaItem[]> => {
    if (!tenant) return [];
    try {
      const data = await fetchAssets(tenant.id, { fileType: 'image' });
      return data.map(mapAssetToMediaItem);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
      return [];
    }
  }, [tenant]);

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
      <h3 className="font-semibold text-lg mb-4">
        {PO_CONSTANTS.LABEL_ATTACHMENTS}
      </h3>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {attachments.map((url, index) => (
            <div
              key={url}
              className="relative group rounded-lg overflow-hidden border border-border aspect-square bg-surface-secondary"
            >
              <img
                src={url}
                alt={`Attachment ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon="Trash2"
                  onClick={() => removeAttachment(url)}
                >
                  {PO_CONSTANTS.BTN_DELETE_ATTACHMENT}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center text-center text-muted-foreground hover:bg-surface-secondary hover:border-primary cursor-pointer transition-colors"
        onClick={handleUploadClick}
      >
        {isUploading ? (
          <>
            <Icon
              name="Loader2"
              size={32}
              className="mb-2 text-muted-foreground animate-spin"
            />
            <p className="text-sm font-medium">
              {PO_CONSTANTS.UPLOAD_UPLOADING}
            </p>
          </>
        ) : (
          <>
            <Icon
              name="UploadCloud"
              size={32}
              className="mb-2 text-muted-foreground"
            />
            <p className="text-sm font-medium">
              {PO_CONSTANTS.UPLOAD_HINT_MAIN}
            </p>
            <p className="text-xs mt-1">{PO_CONSTANTS.UPLOAD_HINT_SUB}</p>
          </>
        )}
        <input
          type="file"
          multiple
          accept={PO_CONSTANTS.UPLOAD_ACCEPTED_TYPES}
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          type="button"
          variant="outline"
          leftIcon="Image"
          onClick={() => setIsMediaModalOpen(true)}
        >
          {PO_CONSTANTS.BTN_SELECT_FROM_LIBRARY}
        </Button>
      </div>

      {tenant && (
        <MediaLibraryModal
          open={isMediaModalOpen}
          onOpenChange={setIsMediaModalOpen}
          queryKey={['po-media-library', tenant.id]}
          queryFn={fetchMediaItems}
          onSelect={handleSelectFromLibrary}
        />
      )}
    </div>
  );
}
