import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  AddButton,
  FilterBar,
  KpiCard,
  KpiGrid,
  PageLayout,
  PageHeader,
  KPISection,
  TableSection,
  type FilterFieldConfig,
} from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import {
  useBomList,
  useApproveBom,
  useDeprecateBom,
  useReviseBom,
} from '@/application/production';
import { BOM_STATUSES, BOM_STATUS_LABELS } from '@/schema/bom.schema';
import type { BomFilter, BomTemplate } from '@/domain/production/bom.types';

import { BomList } from './BomList';
import { BOM_MESSAGES } from './bom.constants';

type ActionSheetState =
  | { type: 'idle' }
  | { type: 'approve'; bomId: string; bomCode: string }
  | { type: 'deprecate'; bomId: string; bomCode: string }
  | { type: 'revise'; bomId: string; bomCode: string };

export function BomListPage() {
  const navigate = useNavigate();
  const {
    filters: filter,
    setFilter: setFilterValue,
    clearFilters,
  } = useUrlFilterState(['search', 'status']);
  const [actionSheet, setActionSheet] = useState<ActionSheetState>({
    type: 'idle',
  });
  const [actionReason, setActionReason] = useState('');

  const { data: boms = [], isLoading } = useBomList(filter as BomFilter);
  const approveBom = useApproveBom();
  const deprecateBom = useDeprecateBom();
  const reviseBom = useReviseBom();

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Mã hoặc tên BOM...',
    },
    {
      key: 'status',
      type: 'combobox',
      label: 'Trạng thái',
      options: BOM_STATUSES.map((s) => ({
        value: s,
        label: BOM_STATUS_LABELS[s],
      })),
    },
  ];

  function handleFilterChange(key: string, value: string | undefined) {
    setFilterValue(key, value);
  }

  const closeActionSheet = () => {
    setActionSheet({ type: 'idle' });
    setActionReason('');
  };

  const openDeprecateSheet = (bomId: string, bomCode: string) => {
    setActionSheet({
      type: 'deprecate',
      bomId,
      bomCode,
    });
  };

  const handleConfirmAction = async () => {
    if (actionSheet.type === 'idle') return;

    try {
      if (actionSheet.type === 'approve') {
        await approveBom.mutateAsync({
          id: actionSheet.bomId,
          reason: actionReason || 'Phê duyệt',
        });
        toast.success(`Đã phê duyệt BOM ${actionSheet.bomCode}`);
      }

      if (actionSheet.type === 'deprecate') {
        if (!actionReason.trim()) {
          toast.error('Vui lòng nhập lý do báo phế.');
          return;
        }
        await deprecateBom.mutateAsync({
          id: actionSheet.bomId,
          reason: actionReason,
        });
        toast.success(`Đã báo phế BOM ${actionSheet.bomCode}`);
      }

      if (actionSheet.type === 'revise') {
        if (!actionReason.trim()) {
          toast.error('Vui lòng nhập lý do tạo phiên bản mới.');
          return;
        }
        await reviseBom.mutateAsync({
          id: actionSheet.bomId,
          reason: actionReason,
        });
        toast.success(`Đã tạo phiên bản mới cho BOM ${actionSheet.bomCode}`);
      }

      closeActionSheet();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  };

  const isMutating =
    approveBom.isPending || deprecateBom.isPending || reviseBom.isPending;

  const hasFilter = !!(filter.search || filter.status);

  const handleSelect = (bom: BomTemplate) => navigate(`/bom/${bom.id}`);
  const handleEdit = (bom: BomTemplate) => navigate(`/bom/${bom.id}/edit`);

  return (
    <PageLayout aria-label={BOM_MESSAGES.ARIA_LIST_CONTAINER}>
      <PageHeader
        title="Định mức (BOM)"
        subtitle="Quản lý thẻ định mức BOM"
        actions={
          <AddButton
            onClick={() => navigate('/bom/create')}
            label={BOM_MESSAGES.BTN_ADD}
            aria-label={BOM_MESSAGES.ARIA_ADD_NEW}
          />
        }
      />

      {/* KPI */}
      <KPISection>
        <KpiGrid>
          <KpiCard
            variant="primary"
            label={BOM_MESSAGES.KPI_TOTAL}
            value={boms.length}
            icon="Layers"
            footer={BOM_MESSAGES.KPI_TOTAL_DESC}
          />
          <KpiCard
            variant="success"
            label={BOM_MESSAGES.KPI_APPROVED}
            value={boms.filter((b) => b.status === 'approved').length}
            icon="CheckCircle"
            footer={BOM_MESSAGES.KPI_APPROVED_DESC}
          />
        </KpiGrid>
      </KPISection>

      {/* Filters */}
      <FilterBar
        schema={filterSchema}
        value={filter}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Table */}
      <TableSection aria-label={BOM_MESSAGES.ARIA_DATA_TABLE}>
        <BomList
          boms={boms}
          isLoading={isLoading}
          hasFilter={hasFilter}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onDeprecate={(bom) => openDeprecateSheet(bom.id, bom.code)}
          onCreate={() => navigate('/bom/create')}
        />
      </TableSection>

      {/* Action Sheet */}
      {renderActionSheet()}
    </PageLayout>
  );

  function renderActionSheet() {
    if (actionSheet.type === 'idle') return null;

    const titles: Record<string, string> = {
      approve: `Phê duyệt BOM ${actionSheet.bomCode}`,
      deprecate: `Báo phế BOM ${actionSheet.bomCode}`,
      revise: `Tạo phiên bản mới — ${actionSheet.bomCode}`,
    };

    const needsReason = actionSheet.type !== 'approve';
    const reasonLabels: Record<string, string> = {
      deprecate: 'Lý do ngừng áp dụng',
      revise: 'Lý do tạo phiên bản mới',
    };

    return (
      <AdaptiveSheet
        open
        onClose={closeActionSheet}
        title={titles[actionSheet.type] ?? ''}
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              className="flex-1"
              type="button"
              onClick={closeActionSheet}
              disabled={isMutating}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              type="button"
              onClick={handleConfirmAction}
              isLoading={isMutating}
            >
              Xác nhận
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {actionSheet.type === 'approve' && (
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn phê duyệt BOM này? Sau khi duyệt, BOM sẽ
              được áp dụng cho sản xuất.
            </p>
          )}
          {needsReason && (
            <div className="form-field">
              <label>{reasonLabels[actionSheet.type]}</label>
              <textarea
                className="field-input min-h-[80px]"
                placeholder="Nhập lý do..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                autoFocus
              />
            </div>
          )}
          {actionSheet.type === 'approve' && (
            <div className="form-field">
              <label>Ghi chú (tùy chọn)</label>
              <textarea
                className="field-input min-h-[60px]"
                placeholder="Ghi chú phê duyệt..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          )}
        </div>
      </AdaptiveSheet>
    );
  }
}
