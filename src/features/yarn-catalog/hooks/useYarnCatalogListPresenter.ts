import { useState, useCallback } from 'react';

import { useConfirm } from '@/shared/components/ConfirmDialog';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import {
  useDeleteYarnCatalog,
  useYarnCatalogList,
} from '@/application/settings';
import type {
  YarnCatalog,
  YarnCatalogFilter,
} from '@/features/yarn-catalog/types';
import { YARN_CATALOG_MESSAGES } from '@/features/yarn-catalog/yarn-catalog.constants';

export function useYarnCatalogListPresenter() {
  const { filters, setFilter, clearFilters } = useUrlFilterState([
    'search',
    'status',
    'lot_no',
    'grade',
  ]);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useYarnCatalogList(
    filters as YarnCatalogFilter,
    page,
  );

  const deleteMutation = useDeleteYarnCatalog();
  const { confirm, alert } = useConfirm();

  const catalogs = data?.data ?? [];
  const hasFilter = !!(
    filters.search ||
    filters.status ||
    filters.lot_no ||
    filters.grade
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      setPage(1);
      setFilter(key, value);
    },
    [setFilter],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setPage(1);
  }, [clearFilters]);

  // --- Delete Safety Workflow ---
  const handleDelete = useCallback(
    async (catalog: YarnCatalog) => {
      // Safety step 1: Prevent accidental deletion of active catalogs without warning
      if (catalog.status === 'active') {
        const confirmActive = await confirm({
          title: 'Cảnh báo an toàn',
          message: `Mã sợi "${catalog.code}" đang ở trạng thái ĐANG DÙNG. Bạn có thực sự muốn xóa mã sợi này không? Hành động này có thể ảnh hưởng đến các phiếu xuất/nhập kho đang liên kết.`,
          variant: 'danger',
          confirmLabel: 'Vẫn Xóa',
        });
        if (!confirmActive) return;
      } else {
        // Standard confirm for inactive
        const ok = await confirm({
          title: 'Xác nhận xóa',
          message: YARN_CATALOG_MESSAGES.DELETE_CONFIRM.replace(
            '{name}',
            catalog.name,
          ),
          variant: 'danger',
          confirmLabel: 'Xóa',
        });
        if (!ok) return;
      }

      // Execute deletion
      deleteMutation.mutate(catalog.id, {
        onError: (err) => {
          // Safety step 2: Graceful error handling (Foreign key violation, etc)
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('foreign key constraint')) {
            alert(
              'Không thể xóa loại sợi này vì đã phát sinh dữ liệu liên quan (tồn kho, phiếu xuất/nhập). Vui lòng chuyển trạng thái sang "Ngừng dùng" thay vì xóa.',
              'Lỗi ràng buộc dữ liệu',
            );
          } else {
            alert(`Lỗi hệ thống khi xóa: ${msg}`, 'Thất bại');
          }
        },
      });
    },
    [confirm, alert, deleteMutation],
  );

  return {
    // State
    filters,
    page,
    catalogs,
    total: data?.total ?? 0,
    paginationResult: data,
    isLoading,
    error,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    hasFilter,

    // Actions
    setPage,
    handleFilterChange,
    handleClearFilters,
    handleDelete,
  };
}
