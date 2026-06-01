import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';
import type { YarnCatalog } from '@/features/yarn-catalog/types';
import { useConfirm } from '@/shared/hooks/useConfirm';
import { EmptyState } from '@/shared/components/EmptyState';
import { DataTable } from '@/shared/components/DataTable';
import {
  COMPATIBILITY_LEVELS,
  type YarnKnittingEngineering,
} from '@/schema/yarn-engineering.schema';
import {
  useYarnKnittingEngineering,
  useDeleteYarnKnittingEngineering,
} from '@/features/yarn-catalog/hooks/useYarnEngineering';

import { YarnEngineeringMatrixModal } from './YarnEngineeringMatrixModal';

type StepKnittingEngineeringProps = {
  hidden: boolean;
  catalog: YarnCatalog | null;
};

export function StepKnittingEngineering({
  hidden,
  catalog,
}: StepKnittingEngineeringProps) {
  const isEditing = catalog !== null;
  const yarnId = catalog?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<YarnKnittingEngineering | null>(null);

  const { data: matrixItems, isLoading } = useYarnKnittingEngineering(yarnId);
  const deleteMutation = useDeleteYarnKnittingEngineering();
  const { confirm } = useConfirm();

  const handleEdit = (record: YarnKnittingEngineering) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Xóa cấu hình',
      message: 'Bạn có chắc chắn muốn xóa cấu hình máy dệt này?',
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const getLevelColor = (level: string) => {
    return (
      COMPATIBILITY_LEVELS.find((l) => l.value === level)?.color ||
      'bg-gray-100 text-gray-800'
    );
  };

  const getLevelLabel = (level: string) => {
    return COMPATIBILITY_LEVELS.find((l) => l.value === level)?.label || level;
  };

  return (
    <div className={hidden ? 'hidden' : 'block'}>
      <fieldset className="form-section min-h-[300px]">
        <legend className="form-section-title">
          Kỹ thuật dệt (Engineering Matrix)
        </legend>

        {!isEditing ? (
          <EmptyState
            icon="alert-circle"
            title="Sợi chưa được lưu"
            description="Bạn cần lưu Thông tin Sợi này trước khi có thể cấu hình Kỹ thuật dệt (Machine Spec)."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-secondary">
                Danh sách cấu hình máy dệt
              </h3>
              <button
                type="button"
                className="btn btn-secondary text-sm h-8"
                onClick={() => {
                  setEditingRecord(null);
                  setIsModalOpen(true);
                }}
              >
                <Icon name="plus" className="w-4 h-4 mr-1.5" />
                Thêm cấu hình
              </button>
            </div>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <DataTable
                data={matrixItems || []}
                isLoading={isLoading}
                rowKey={(item) => item.id || Math.random().toString()}
                emptyStateTitle="Chưa có cấu hình"
                emptyStateDescription="Chưa có cấu hình máy dệt nào được thiết lập."
                renderMobileCard={(item) => (
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">
                        {item.fabric_structure?.name || 'Không rõ'}
                      </div>
                      <Badge
                        className={getLevelColor(item.compatibility_level)}
                      >
                        {getLevelLabel(item.compatibility_level)}
                      </Badge>
                    </div>
                    <div className="text-sm mt-2 flex gap-4">
                      <span>
                        {item.recommended_rpm
                          ? `${item.recommended_rpm} rpm`
                          : '- rpm'}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        className="text-primary p-2"
                        onClick={() => handleEdit(item)}
                      >
                        <Icon name="edit" className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-500 p-2"
                        onClick={() => item.id && handleDelete(item.id)}
                      >
                        <Icon name="trash-2" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                columns={[
                  {
                    header: 'Kiểu dệt',
                    id: 'structure',
                    cell: (item) => (
                      <span className="font-medium">
                        {item.fabric_structure?.name || 'Không rõ'}
                      </span>
                    ),
                  },
                  {
                    header: 'Cấu hình máy',
                    id: 'machine',
                    cell: (item) => {
                      const diameter = item.machine_spec?.diameter
                        ? `${item.machine_spec.diameter}"`
                        : '';
                      const gauge = item.machine_spec?.gauge
                        ? `${item.machine_spec.gauge}G`
                        : '';
                      const family = item.machine_spec?.machine_family || '';
                      return (
                        [diameter, gauge, family].filter(Boolean).join(' - ') ||
                        'Cấu hình trống'
                      );
                    },
                  },
                  {
                    header: 'Mức độ',
                    id: 'level',
                    cell: (item) => (
                      <Badge
                        className={getLevelColor(item.compatibility_level)}
                      >
                        {getLevelLabel(item.compatibility_level)}
                      </Badge>
                    ),
                  },
                  {
                    header: 'RPM',
                    id: 'rpm',
                    cell: (item) =>
                      item.recommended_rpm
                        ? `${item.recommended_rpm} vòng/phút`
                        : '-',
                  },
                  {
                    header: 'Thao tác',
                    id: 'actions',
                    className: 'text-right',
                    cell: (item) => (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-primary hover:text-primary/80 p-1"
                          onClick={() => handleEdit(item)}
                        >
                          <Icon name="edit" className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-600 p-1"
                          onClick={() => item.id && handleDelete(item.id)}
                        >
                          <Icon name="trash-2" className="w-4 h-4" />
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
            <p className="text-xs text-text-tertiary">
              Cấu hình này sẽ được sử dụng để gợi ý máy dệt và thiết lập thông
              số tự động trên ứng dụng MES.
            </p>
          </div>
        )}

        {yarnId && (
          <YarnEngineeringMatrixModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            yarnId={yarnId}
            editingRecord={editingRecord}
          />
        )}
      </fieldset>
    </div>
  );
}
