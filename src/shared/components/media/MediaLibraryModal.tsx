import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Icon, Button, AdaptiveSheet } from '@/shared/components';
import { cn } from '@/shared/utils/cn';

export type MediaItem = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  updatedAt?: string;
};

interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  queryKey: string[];
  queryFn: () => Promise<MediaItem[]>;
  onSelect: (item: MediaItem) => void;
}

export function MediaLibraryModal({
  open,
  onOpenChange,
  title = 'Thư viện ảnh',
  queryKey,
  queryFn,
  onSelect,
}: MediaLibraryModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: items,
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: open,
  });

  const handleConfirm = () => {
    if (!selectedId || !items) return;
    const selectedItem = items.find((item) => item.id === selectedId);
    if (selectedItem) {
      onSelect(selectedItem);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    onOpenChange(false);
  };

  const header = (
    <div className="flex flex-col gap-3">
      <div className="text-xl font-bold">{title}</div>
      <div className="relative">
        <Icon
          name="Search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Tìm kiếm... (Comming soon)"
          className="w-full pl-9 pr-4 py-2 text-sm bg-surface rounded-md border border-border opacity-50 cursor-not-allowed focus:outline-none"
          disabled
        />
      </div>
    </div>
  );

  const footer = (
    <div className="flex w-full justify-between items-center px-2">
      <div className="text-sm font-medium text-muted-foreground">
        {selectedId ? '1 ảnh đang chọn' : 'Chưa chọn ảnh nào'}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleClose}>
          Hủy
        </Button>
        <Button onClick={handleConfirm} disabled={!selectedId || isLoading}>
          Chọn ảnh
        </Button>
      </div>
    </div>
  );

  return (
    <AdaptiveSheet
      open={open}
      onClose={handleClose}
      header={header}
      footer={footer}
      size="xl"
    >
      <div className="py-2">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-surface rounded-lg border border-border p-3 space-y-3"
              >
                <div className="aspect-square bg-surface-secondary rounded-md" />
                <div className="h-3 bg-surface-secondary rounded w-3/4 mx-auto" />
                <div className="h-2 bg-surface-secondary rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="h-64 flex flex-col items-center justify-center text-danger text-center bg-danger-soft/20 rounded-lg border border-danger-soft">
            <Icon name="AlertCircle" className="w-12 h-12 mb-2 opacity-80" />
            <p className="font-medium">Đã xảy ra lỗi khi tải thư viện ảnh.</p>
          </div>
        ) : !items?.length ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-center bg-surface-secondary/50 rounded-lg border border-dashed border-border">
            <Icon name="Image" className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium text-foreground mb-1">
              Chưa có ảnh nào trong thư viện.
            </p>
            <p className="text-sm">Hãy tải ảnh mới lên thay thế.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'group cursor-pointer relative bg-surface rounded-lg border p-2 transition-all duration-200 hover:shadow-md',
                    isSelected
                      ? 'border-primary shadow-sm bg-brand-soft/20 ring-2 ring-primary ring-offset-1'
                      : 'border-border shadow-sm hover:border-primary/50',
                  )}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="aspect-square rounded-md overflow-hidden bg-surface-secondary relative mb-3">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-inverse-foreground rounded-full p-1 shadow-sm">
                        <Icon name="Check" size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="text-center px-1">
                    <p
                      className="text-sm font-bold truncate text-foreground"
                      title={item.title}
                    >
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p
                        className="text-[11px] text-muted-foreground truncate mt-0.5"
                        title={item.subtitle}
                      >
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdaptiveSheet>
  );
}
