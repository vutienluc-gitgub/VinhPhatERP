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
import { YARN_CATALOG_MESSAGES as MSG } from '@/features/yarn-catalog/yarn-catalog.constants';

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
      title: MSG.CONFIRM_DEL_MATRIX_TITLE,
      message: MSG.CONFIRM_DEL_MATRIX_DESC,
      confirmLabel: MSG.BTN_DELETE,
      cancelLabel: MSG.BTN_CANCEL,
      variant: 'danger',
    });
    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const getLevelColor = (level: string) => {
    return (
      COMPATIBILITY_LEVELS.find((l) => l.value === level)?.color ||
      'bg-surface-secondary text-foreground'
    );
  };

  const getLevelLabel = (level: string) => {
    return COMPATIBILITY_LEVELS.find((l) => l.value === level)?.label || level;
  };

  return (
    <div className={hidden ? 'hidden' : 'block'}>
      <fieldset className="form-section min-h-[300px]">
        <legend className="form-section-title">{MSG.SECTION_KNITTING}</legend>

        {!isEditing ? (
          <EmptyState
            icon="alert-circle"
            title={MSG.EMPTY_KNITTING_TITLE}
            description={MSG.EMPTY_KNITTING_DESC}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-secondary">
                {MSG.LBL_KNITTING_LIST}
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
                {MSG.BTN_ADD_KNITTING}
              </button>
            </div>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <DataTable
                data={matrixItems || []}
                isLoading={isLoading}
                rowKey={(item) => item.id || Math.random().toString()}
                emptyStateTitle={MSG.EMPTY_MATRIX_TITLE}
                emptyStateDescription={MSG.EMPTY_MATRIX_DESC}
                renderMobileCard={(item) => (
                  <div className="p-4 bg-surface rounded-lg border border-default">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">
                        {item.fabric_structure?.name || MSG.VAL_UNKNOWN}
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
                        className="text-foreground p-2"
                        onClick={() => handleEdit(item)}
                      >
                        <Icon name="edit" className="w-4 h-4" />
                      </button>
                      <button
                        className="text-danger p-2"
                        onClick={() => item.id && handleDelete(item.id)}
                      >
                        <Icon name="trash-2" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                columns={[
                  {
                    header: MSG.MATRIX_LBL_STRUCTURE,
                    id: 'structure',
                    cell: (item) => (
                      <span className="font-medium">
                        {item.fabric_structure?.name || MSG.VAL_UNKNOWN}
                      </span>
                    ),
                  },
                  {
                    header: MSG.MATRIX_LBL_MACHINE,
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
                        MSG.VAL_EMPTY_CONFIG
                      );
                    },
                  },
                  {
                    header: MSG.COL_LEVEL,
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
                    header: MSG.COL_RPM,
                    id: 'rpm',
                    cell: (item) =>
                      item.recommended_rpm
                        ? `${item.recommended_rpm} vòng/phút`
                        : '-',
                  },
                  {
                    header: MSG.COL_ACTIONS,
                    id: 'actions',
                    className: 'text-right',
                    cell: (item) => (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-foreground hover:text-foreground/80 p-1"
                          onClick={() => handleEdit(item)}
                        >
                          <Icon name="edit" className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="text-danger hover:text-danger p-1"
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
            <p className="text-xs text-text-tertiary">{MSG.MATRIX_HINT}</p>
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
