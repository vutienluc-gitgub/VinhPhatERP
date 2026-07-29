import { useState } from 'react';

import {
  Icon,
  DataTable,
  PageHeader,
  TableSection,
  ErrorInline,
} from '@/shared/components';
import { useConfirm } from '@/shared/hooks/useConfirm';
import type { MachineSpecification } from '@/schema/yarn-engineering.schema';
import {
  useMachineSpecsAdmin,
  useToggleMachineSpecStatus,
} from '@/features/looms/hooks/useMachineSpecsAdmin';
import { LOOM_MESSAGES as MSG } from '@/features/looms/loom.constants';
import { useMachineSpecColumns } from '@/features/looms/hooks/useMachineSpecColumns';

import { MachineSpecForm } from './MachineSpecForm';
import { MachineSpecMobileCard } from './MachineSpecMobileCard';

export function MachineSpecList() {
  const { data: machineSpecs, isLoading, error } = useMachineSpecsAdmin();
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
      title: isActivating
        ? MSG.CONFIRM_SPEC_RESTORE_TITLE
        : MSG.CONFIRM_SPEC_HIDE_TITLE,
      message: isActivating
        ? MSG.CONFIRM_SPEC_RESTORE_MSG
        : MSG.CONFIRM_SPEC_HIDE_MSG,
      confirmLabel: isActivating
        ? MSG.CONFIRM_SPEC_RESTORE_BTN
        : MSG.CONFIRM_SPEC_HIDE_BTN,
      cancelLabel: MSG.BTN_CANCEL,
      variant: isActivating ? 'default' : 'danger',
    });

    if (isConfirmed && record.id) {
      try {
        await toggleStatusMutation.mutateAsync({
          id: record.id,
          isActive: isActivating,
        });
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        await confirm({
          title: 'Lỗi',
          message: `${MSG.ERR_SPEC_TOGGLE}${errMessage}`,
          variant: 'danger',
          cancelLabel: 'Đóng',
          confirmLabel: '',
        });
      }
    }
  };

  const columns = useMachineSpecColumns({
    onEdit: handleEdit,
    onToggleStatus: handleToggleStatus,
  });

  return (
    <>
      <PageHeader
        title={MSG.SPEC_PAGE_TITLE}
        subtitle={MSG.SPEC_PAGE_SUBTITLE}
        actions={
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={() => {
              setEditingRecord(null);
              setIsModalOpen(true);
            }}
          >
            <Icon name="Plus" size={18} />
            {MSG.BTN_SPEC_CREATE}
          </button>
        }
      />

      <TableSection>
        {error ? (
          <div className="p-4">
            <ErrorInline>
              {error instanceof Error ? error.message : String(error)}
            </ErrorInline>
          </div>
        ) : (
          <DataTable
            data={machineSpecs || []}
            isLoading={isLoading}
            rowKey={(item) => item.id || Math.random().toString()}
            renderMobileCard={(item) => (
              <MachineSpecMobileCard item={item} onEdit={handleEdit} />
            )}
            columns={columns}
          />
        )}

        {isModalOpen && (
          <MachineSpecForm
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            editingRecord={editingRecord}
          />
        )}
      </TableSection>
    </>
  );
}
