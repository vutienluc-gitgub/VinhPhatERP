import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
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
import { MEDIA_LIMITS } from '@/features/media/media.constants';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTenant } from '@/shared/hooks/useTenant';
import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';

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
    if (!isUploading) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';

    if (files.length === 0) return;

    const acceptedMimes = PO_CONSTANTS.UPLOAD_ACCEPTED_MIMES as readonly string[];
    const invalidType = files.find((file) => !acceptedMimes.includes(file.type));
    if (invalidType) {
      toast.error(PO_CONSTANTS.UPLOAD_INVALID_TYPE);
      return;
    }

    const oversized = files.find(
      (file) => file.size > PO_CONSTANTS.UPLOAD_MAX_SIZE_BYTES,
    );
    if (oversized) {
      toast.error(PO_CONSTANTS.UPLOAD_FILE_TOO_LARGE);
      return;
    }

    if (!tenant?.id || !user?.id) {
      toast.error(PO_CONSTANTS.UPLOAD_ERROR);
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    try {
      for (const file of files) {
        const result = await uploadFile(file, tenant.id, user.id, null, true);
        if (result.publicUrl && !attachments.includes(result.publicUrl)) {
          setValue(
            'attachments',
            [...(form.getValues('attachments') || []), result.publicUrl],
            { shouldDirty: true },
          );
        }
        successCount++;
      }

      if (successCount > 0) {
        toast.success(
          files.length === 1
            ? PO_CONSTANTS.UPLOAD_SUCCESS
            : `${PO_CONSTANTS.UPLOAD_SUCCESS} (${successCount}/${files.length})`,
        );
      }
    } catch (error) {
      console.error('PO attachment upload failed:', error);
      toast.error(PO_CONSTANTS.UPLOAD_ERROR);
    } finally {
      setIsUploading(false);
    }
  };

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
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center text-center text-muted-foreground transition-colors ${
          isUploading
            ? 'cursor-wait bg-surface-secondary'
            : 'hover:bg-surface-secondary hover:border-primary cursor-pointer'
        }`}
        onClick={handleUploadClick}
        aria-busy={isUploading}
      >
        {isUploading ? (
          <Icon
            name="Loader2"
            size={32}
            className="mb-2 text-muted-foreground animate-spin"
          />
        ) : (
          <Icon
            name="UploadCloud"
            size={32}
            className="mb-2 text-muted-foreground"
          />
        )}
        <p className="text-sm font-medium">
          {isUploading
            ? PO_CONSTANTS.UPLOAD_UPLOADING
            : PO_CONSTANTS.UPLOAD_HINT_MAIN}
        </p>
        <p className="text-xs mt-1">{PO_CONSTANTS.UPLOAD_HINT_SUB}</p>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          accept={PO_CONSTANTS.UPLOAD_ACCEPTED_TYPES}
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          type="button"
          variant="outline"
          leftIcon="Image"
          onClick={() => setIsMediaModalOpen(true)}
          disabled={isUploading}
        >
          Chọn ảnh từ Thư viện Media
        </Button>
      </div>

      {tenant && (
        <MediaLibraryModal
          open={isMediaModalOpen}
          onOpenChange={setIsMediaModalOpen}
          queryKey={['po-media-library', tenant.id]}
          queryFn={async () => {
            const data = await fetchAssets(tenant.id, { fileType: 'image' });
            return data.map((item) => ({
              id: item.id,
              imageUrl: item.public_url || item.storage_path,
              title: item.original_name,
              subtitle: `Kích thước: ${(item.size_bytes / 1024).toFixed(1)} KB`,
            }));
          }}
          onSelect={handleSelectFromLibrary}
        />
      )}
    </div>
  );
}
