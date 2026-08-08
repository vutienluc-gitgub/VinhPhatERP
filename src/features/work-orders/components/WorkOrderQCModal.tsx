import { useState } from 'react';

import type { WorkOrder } from '@/features/work-orders/types';
import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';

interface WorkOrderQCModalProps {
  wo: WorkOrder;
  isPending?: boolean;
  onClose: () => void;
  onApprove: (data: { actualYield: number; qcNotes: string }) => void;
  onReject: (data: { qcNotes: string }) => void;
}

export function WorkOrderQCModal({
  wo,
  isPending,
  onClose,
  onApprove,
  onReject,
}: WorkOrderQCModalProps) {
  const [actualYield, setActualYield] = useState<number>(
    wo.actual_yield_m || wo.target_quantity,
  );
  const [qcNotes, setQcNotes] = useState<string>('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-surface relative z-10 w-full max-w-md rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-lg font-bold">Nghiệm thu chất lượng (QC)</h2>
          <button type="button" className="btn-icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body p-4 space-y-4">
          <div className="form-field">
            <label className="field-label">Sản lượng thực tế (m)</label>
            <input
              type="number"
              className="field-input"
              value={actualYield}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setActualYield(Number(e.target.value))
              }
            />
          </div>

          <div className="form-field">
            <label className="field-label">Ghi chú QC</label>
            <textarea
              className="field-input h-24"
              placeholder="Ghi chú về chất lượng, lỗi sợi, mộc..."
              value={qcNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setQcNotes(e.target.value)
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer flex gap-2 justify-end">
          <Button variant="danger" onClick={() => onReject({ qcNotes })}>
            Từ chối (Làm lại)
          </Button>
          <Button
            variant="primary"
            disabled={
              isPending || actualYield === undefined || actualYield === null
            }
            onClick={() =>
              onApprove({ actualYield: actualYield as number, qcNotes })
            }
          >
            Duyệt & Đóng lệnh
          </Button>
        </div>
      </div>
    </div>
  );
}
