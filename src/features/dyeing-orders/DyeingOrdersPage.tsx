import { useState } from 'react';

import {
  KpiCardPremium,
  AddButton,
  FilterBarPremium,
  type FilterFieldConfig,
} from '@/shared/components';
import { useUrlFilterState } from '@/shared/hooks/useUrlFilterState';
import { useDyeingOrderList } from '@/application/production';

import { DyeingOrderList } from './DyeingOrderList';
import { DyeingOrderForm } from './DyeingOrderForm';
import { DyeingOrderDetail } from './DyeingOrderDetail';
import type { DyeingOrder, DyeingOrderFilter } from './types';

export function DyeingOrdersPage() {
  const {
    filters: filter,
    setFilter: setFilterValue,
    clearFilters,
  } = useUrlFilterState(['search']);
  const [page] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DyeingOrder | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filterSchema: FilterFieldConfig[] = [
    {
      key: 'search',
      type: 'search',
      label: 'Tìm kiếm',
      placeholder: 'Mã lệnh, nhà cung cấp...',
    },
  ];

  const { data, isLoading } = useDyeingOrderList(
    filter as DyeingOrderFilter,
    page,
  );

  const totalCount = data?.total ?? 0;
  const inProgressCount =
    data?.data.filter((o) => o.status === 'in_progress').length ?? 0;
  const draftCount = data?.data.filter((o) => o.status === 'draft').length ?? 0;

  if (selectedId) {
    return (
      <div className="page-container">
        <DyeingOrderDetail
          orderId={selectedId}
          onBack={() => setSelectedId(null)}
          onEdit={(order) => {
            setEditingOrder(order);
            setIsFormOpen(true);
          }}
        />

        <DyeingOrderForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          editingOrder={editingOrder}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="panel-card card-flush">
        {/* Action bar */}
        <div className="card-header-area">
          <AddButton
            onClick={() => {
              setEditingOrder(null);
              setIsFormOpen(true);
            }}
            label="Tạo lệnh nhuộm"
          />
        </div>

        {/* KPI Dashboard */}
        <div className="kpi-section kpi-grid">
          <KpiCardPremium
            label="Tổng lệnh"
            value={totalCount}
            icon="Layers"
            variant="primary"
          />
          <KpiCardPremium
            label="Đang nhuộm"
            value={inProgressCount}
            icon="Loader2"
            variant="warning"
          />
          <KpiCardPremium
            label="Bản nháp"
            value={draftCount}
            icon="Pencil"
            variant="secondary"
          />
        </div>

        {/* Filters (Config-Driven) */}
        <FilterBarPremium
          schema={filterSchema}
          value={filter}
          onChange={setFilterValue}
          onClear={clearFilters}
        />

        {/* Main Content View */}
        <div className="card-table-section min-h-[400px]">
          <DyeingOrderList
            data={data?.data ?? []}
            isLoading={isLoading}
            onView={(id) => setSelectedId(id)}
            onEdit={(order) => {
              setEditingOrder(order);
              setIsFormOpen(true);
            }}
          />
        </div>

        <DyeingOrderForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          editingOrder={editingOrder}
        />
      </div>
    </div>
  );
}
