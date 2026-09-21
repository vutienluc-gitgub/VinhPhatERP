import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';

export function useFabricCatalogForm({
  catalog,
  onClose,
}: {
  catalog: FabricCatalog | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'public' | 'gallery' | 'admin'>('info');
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const methods = useForm({
    defaultValues: catalog || {
      name: '',
      code: '',
      composition: '',
      status: 'active',
      width: '',
      weight: '',
      description: '',
      slug: '',
    },
  });

  const onSubmit = methods.handleSubmit(async (data) => {
    try {
      setIsPending(true);
      console.log('Saved catalog:', data);
      onClose();
    } catch (err: any) {
      setMutationError(err.message || 'Lỗi khi lưu mẫu vải');
    } finally {
      setIsPending(false);
    }
  });

  return {
    methods,
    activeTab,
    setActiveTab,
    isEditing: !!catalog,
    isPending,
    mutationError,
    publicUrl: `https://vinhphaterp.vn/catalog/${catalog?.id || 'demo'}`,
    isSlugEditing,
    printAreaRef,
    handleDownloadQR: () => console.log('Download QR'),
    handlePrintQR: () => console.log('Print QR'),
    handleCopyLink: () => console.log('Copy link'),
    handleSlugEditStart: () => setIsSlugEditing(true),
    handleSlugEditCancel: () => setIsSlugEditing(false),
    onSubmit,
    labelData: {
      code: catalog?.code || 'MAU-VAI',
      name: catalog?.name || 'Mẫu Vải',
      composition: catalog?.composition || 'Cotton',
    },
  };
}
