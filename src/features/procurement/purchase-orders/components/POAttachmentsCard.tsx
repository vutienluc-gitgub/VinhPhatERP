import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  Icon,
  Button,
  MediaLibraryModal,
  type MediaItem,
} from '@/shared/components';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';
// eslint-disable-next-line boundaries/dependencies
import { fetchAssets } from '@/features/media/media.service';
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
  const { data: tenant } = useTenant();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // TODO: Handle actual local file upload to storage
    }
    e.target.value = '';
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
        className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center text-center text-muted-foreground hover:bg-gray-50 hover:border-primary cursor-pointer transition-colors"
        onClick={handleUploadClick}
      >
        <Icon
          name="UploadCloud"
          size={32}
          className="mb-2 text-muted-foreground"
        />
        <p className="text-sm font-medium">{PO_CONSTANTS.UPLOAD_HINT_MAIN}</p>
        <p className="text-xs mt-1">{PO_CONSTANTS.UPLOAD_HINT_SUB}</p>
        <input
          type="file"
          multiple
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
