import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { UseMutationResult } from '@tanstack/react-query';

import { AdvancedImageUploader, Icon } from '@/shared/components';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

type ImageSectionProps = {
  uploadImageMutation: UseMutationResult<string, Error, File>;
  deleteImageMutation: UseMutationResult<void, Error, string>;
};

export function ImageSection({
  uploadImageMutation,
  deleteImageMutation,
}: ImageSectionProps) {
  const { watch, setValue } = useFormContext<FabricCatalogFormValues>();
  const currentImageUrl = watch('image_url');

  const [fileMeta, setFileMeta] = useState<{
    size: string;
    type: string;
  } | null>(null);

  return (
    <div className="form-field mb-6">
      <label>{LABELS.LABEL_IMAGE}</label>
      <AdvancedImageUploader
        value={currentImageUrl}
        uploadFn={async (file) => {
          setFileMeta({
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type.split('/')[1]?.toUpperCase() || 'IMAGE',
          });
          return uploadImageMutation.mutateAsync(file);
        }}
        onSuccess={(url) => setValue('image_url', url)}
        onRemove={() => {
          const currentUrl = currentImageUrl;
          setValue('image_url', null);
          setFileMeta(null);
          if (currentUrl) {
            deleteImageMutation.mutate(currentUrl);
          }
        }}
      />
      {currentImageUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-slate-50/50 p-2.5 rounded-md border border-slate-100">
          <div className="flex items-center gap-1.5 text-success font-medium">
            <Icon name="check-circle-2" className="w-3.5 h-3.5" />
            Đã tải ảnh lên
          </div>
          {fileMeta && (
            <>
              <div className="flex items-center gap-1.5">
                <Icon name="file-image" className="w-3.5 h-3.5" />
                {fileMeta.type}
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="hard-drive" className="w-3.5 h-3.5" />
                {fileMeta.size}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
