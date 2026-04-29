/**
 * Workflow Config — Order Progress Stage (Tiến độ đơn hàng)
 *
 * 7 stages sản xuất: warping → weaving → greige_check → dyeing → finishing → final_check → packing
 * Mỗi stage có status: pending → in_progress → done | skipped
 */
import type { WorkflowConfig } from '@/lib/workflow-engine/types';

export const orderStageWorkflow: WorkflowConfig = {
  entity: 'order_stage',
  statuses: ['pending', 'in_progress', 'done', 'skipped'],
  initialStatus: 'pending',
  terminalStatuses: [],
  transitions: [
    // Luồng chính
    { from: 'pending', to: 'in_progress', label: 'Bắt đầu' },
    { from: 'pending', to: 'skipped', label: 'Bỏ qua' },
    { from: 'in_progress', to: 'done', label: 'Hoàn thành' },
    { from: 'in_progress', to: 'pending', label: 'Hoàn tác' },

    // Cho phép sửa lại
    { from: 'done', to: 'in_progress', label: 'Mở lại' },
    { from: 'skipped', to: 'pending', label: 'Khôi phục' },
  ],
};
