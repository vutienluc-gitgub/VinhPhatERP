import { useState } from 'react';

import { KpiCardPremium, Icon, AddButton } from '@/shared/components';

import { DyeingOrderList } from './DyeingOrderList';
import { DyeingOrderForm } from './DyeingOrderForm';
import { DyeingOrderDetail } from './DyeingOrderDetail';
import type { DyeingOrder, DyeingOrderFilter } from './types';
import { useDyeingOrderList } from './useDyeingOrders';

export function DyeingOrdersPage() {
  const [filter, setFilter] = useState<DyeingOrderFilter>({
    search: '',
  });
  const [page] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DyeingOrder | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useDyeingOrderList(filter, page);

  const totalCount = data?.total ?? 0;
  const inProgressCount =
    data?.data.filter((o) => o.status === 'in_progress').length ?? 0;
  const draftCount = data?.data.filter((o) => o.status === 'draft').length ?? 0;

  if (selectedId) {
    return (
      <>
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
      </>
    );
  }

  return (
    <div className="panel-card card-flush">
      {/* Premium Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">SẢN XUẤT</p>
          <h3 className="title-premium">Lệnh nhuộm</h3>
        </div>
        <AddButton
          onClick={() => {
            setEditingOrder(null);
            setIsFormOpen(true);
          }}
          label="Tạo lệnh nhuộm"
        />
      </div>

      {/* KPI Dashboard */}
      <div className="kpi-grid p-4 md:p-6 bg-surface-subtle border-b border-border">
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

      {/* Filters Container */}
      <div className="filter-bar card-filter-section p-4 border-b border-border">
        <div className="filter-grid-premium">
          <div className="filter-field max-w-[320px]">
            <label>Tìm kiếm</label>
            <div className="search-input-wrapper">
              <input
                className="field-input"
                placeholder="Tìm mã lệnh, nhà cung cấp..."
                value={filter.search || ''}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    search: e.target.value,
                  })
                }
              />
              <Icon name="Search" size={16} className="search-input-icon" />
            </div>
          </div>
        </div>
      </div>

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
  );
}
