import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import {
  useUploadFabricImage,
  useDeleteFabricImage,
} from '@/application/inventory/useFabricImage';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

export function useFabricGalleryManager() {
  const { control, register } = useFormContext<FabricCatalogFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'images',
  });

  const uploadImageMutation = useUploadFabricImage();
  const deleteImageMutation = useDeleteFabricImage();

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingIndex(fields.length); // Indicate uploading at the end
      const url = await uploadImageMutation.mutateAsync(file);
      append({
        id: '',
        type: 'SWATCH',
        image_url: url,
        display_order: fields.length,
        alt_text: '',
        caption: '',
        is_primary: false,
      });
      toast.success('Tải ảnh lên thành công');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Lỗi tải ảnh lên: ${message}`);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemove = (index: number) => {
    const imageUrl = fields[index]?.image_url;
    if (imageUrl) {
      deleteImageMutation.mutate(imageUrl, {
        onError: (err) => {
          const message = err instanceof Error ? err.message : String(err);
          toast.error(`Lỗi xóa ảnh: ${message}`);
        },
      });
    }
    remove(index);
  };

  const hasSwatch = fields.some((f) => f.type === 'SWATCH');
  const hasSurface = fields.some((f) => f.type === 'SURFACE');
  const hasApplication = fields.some((f) => f.type === 'APPLICATION');

  return {
    control,
    fields,
    register,
    isUploading: uploadImageMutation.isPending,
    uploadingIndex,
    handleFileUpload,
    handleRemove,
    warnings: {
      hasSwatch,
      hasSurface,
      hasApplication,
      showWarnings: !hasSwatch || !hasSurface || !hasApplication,
    },
  };
}
