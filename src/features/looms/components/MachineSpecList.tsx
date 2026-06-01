import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { DataTable } from '@/shared/components/DataTable';
import type { MachineSpecification } from '@/schema/yarn-engineering.schema';
import { MACHINE_TYPES } from '@/schema/yarn-engineering.schema';
import {
  useMachineSpecsAdmin,
  useToggleMachineSpecStatus,
} from '@/features/looms/hooks/useMachineSpecsAdmin';

import { MachineSpecForm } from './MachineSpecForm';

function StatusBadge({ isActive }: { isActive: boolean | undefined }) {
  return (
    <Badge
      className={
        isActive
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-gray-100 text-gray-800'
      }
    >
      {isActive ? 'Đang sử dụng' : 'Đã ẩn'}
    </Badge>
  );
}

function SourceTypeBadge({ sourceType }: { sourceType: string | undefined }) {
  if (sourceType === 'auto_generated') {
    return (
      <span className="inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
        AUTO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-sm bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
      MANUAL
    </span>
  );
}

export function MachineSpecList() {
  const { data: machineSpecs, isLoading } = useMachineSpecsAdmin();
  const toggleStatusMutation = useToggleMachineSpecStatus();
  const { confirm } = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<MachineSpecification | null>(null);

  const handleEdit = (record: MachineSpecification) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (record: MachineSpecification) => {
    const isActivating = !record.is_active;
    const isConfirmed = await confirm({
      title: isActivating ? 'Khôi phục cấu hình' : 'Ẩn cấu hình',
      message: isActivating
        ? 'Bạn có chắc chắn muốn khôi phục cấu hình máy dệt này?'
        : 'Cấu hình này sẽ bị ẩn khỏi các danh sách chọn. Bạn có chắc chắn?',
      confirmLabel: isActivating ? 'Khôi phục' : 'Ẩn',
      cancelLabel: 'Hủy',
      variant: isActivating ? 'default' : 'danger',
    });
    if (isConfirmed && record.id) {
      toggleStatusMutation.mutate({ id: record.id, is_active: isActivating });
    }
  };

  const getTypeLabel = (val?: string | null) => {
    if (!val) return 'Không xác định';
    const found = MACHINE_TYPES.find((t) => t.value === val);
    return found ? found.label : val;
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Thông số kỹ thuật máy dệt
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Quản lý cấu hình Master Data kỹ thuật cho quá trình sản xuất
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRecord(null);
            setIsModalOpen(true);
          }}
        >
          <Icon name="plus" className="w-4 h-4 mr-2" />
          Thêm cấu hình
        </Button>
      </div>

      <DataTable
        data={machineSpecs || []}
        isLoading={isLoading}
        rowKey={(item) => item.id || Math.random().toString()}
        renderMobileCard={(item) => (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold">{item.code || '-'}</div>
                <div className="text-sm text-gray-500">
                  {getTypeLabel(item.machine_type)}
                </div>
              </div>
              <StatusBadge isActive={item.is_active} />
            </div>
            <div className="text-sm mt-2 flex gap-4">
              <span>
                {item.diameter}" - {item.gauge ? `${item.gauge}G` : '?G'}
              </span>
              <span>{item.feeder_count || '-'} F</span>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleEdit(item)}>
                Sửa
              </Button>
            </div>
          </div>
        )}
        columns={[
          {
            header: 'Mã cấu hình',
            id: 'code',
            cell: (item) => (
              <div>
                <div className="font-medium text-primary">
                  {item.code || '-'}
                </div>
                <div className="text-xs text-text-tertiary flex gap-1 mt-1">
                  <SourceTypeBadge sourceType={item.source_type} />
                </div>
              </div>
            ),
          },
          {
            header: 'Loại máy',
            id: 'machine_type',
            cell: (item) => getTypeLabel(item.machine_type),
          },
          {
            header: 'Kích thước & Kim',
            id: 'diameter',
            cell: (item) => (
              <span>
                {item.diameter}" - {item.gauge ? `${item.gauge}G` : '?G'}
              </span>
            ),
          },
          {
            header: 'Feeder',
            id: 'feeder_count',
            cell: (item) => `${item.feeder_count || '-'} F`,
          },
          {
            header: 'Hãng / Nhóm',
            id: 'manufacturer',
            cell: (item) => (
              <div className="text-sm">
                <div>{item.manufacturer || '-'}</div>
                <div className="text-text-tertiary text-xs">
                  {item.machine_family || '-'}
                </div>
              </div>
            ),
          },
          {
            header: 'Trạng thái',
            id: 'is_active',
            cell: (item) => <StatusBadge isActive={item.is_active} />,
          },
          {
            header: '',
            id: 'actions',
            className: 'w-24 text-right',
            cell: (item) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="p-1.5 text-text-secondary hover:text-primary transition-colors"
                  onClick={() => handleEdit(item)}
                  title="Sửa cấu hình"
                >
                  <Icon name="edit" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={`p-1.5 transition-colors ${item.is_active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'} rounded`}
                  onClick={() => handleToggleStatus(item)}
                  title={item.is_active ? 'Ẩn cấu hình' : 'Khôi phục cấu hình'}
                >
                  <Icon
                    name={item.is_active ? 'trash-2' : 'refresh-cw'}
                    className="w-4 h-4"
                  />
                </button>
              </div>
            ),
          },
        ]}
      />

      {isModalOpen && (
        <MachineSpecForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingRecord={editingRecord}
        />
      )}
    </div>
  );
}
