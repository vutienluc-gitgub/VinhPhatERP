import { useState } from 'react';
import toast from 'react-hot-toast';

import {
  ApprovalWorkflow,
  ApprovalWorkflowStep,
} from '@/domains/approval/models/types';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Icon } from '@/shared/components/Icon';
import { Switch } from '@/shared/components/Switch';
import { WorkflowRepository } from '@/domains/approval/repositories/workflow-repository';

import { WorkflowStepCard } from './WorkflowStepCard';

interface WorkflowDesignerBoardProps {
  workflow: Partial<ApprovalWorkflow>;
  initialSteps: ApprovalWorkflowStep[];
  onComplete: () => void;
}

export function WorkflowDesignerBoard({
  workflow: initialWorkflow,
  initialSteps,
  onComplete,
}: WorkflowDesignerBoardProps) {
  const [workflow, setWorkflow] =
    useState<Partial<ApprovalWorkflow>>(initialWorkflow);
  const [steps, setSteps] = useState<
    (Partial<ApprovalWorkflowStep> & { id: string })[]
  >(initialSteps.length > 0 ? initialSteps : []);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddStep = () => {
    const newStep = {
      id: crypto.randomUUID(),
      role: '',
      description: '',
      is_parallel: false,
      conditions: {},
      step_order: steps.length + 1,
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (
    id: string,
    field: keyof ApprovalWorkflowStep,
    value: unknown,
  ) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const handleMoveUp = (id: string) => {
    const index = steps.findIndex((s) => s.id === id);
    if (index > 0) {
      const newSteps = [...steps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[index - 1]!;
      newSteps[index - 1] = temp!;
      setSteps(newSteps);
    }
  };

  const handleMoveDown = (id: string) => {
    const index = steps.findIndex((s) => s.id === id);
    if (index < steps.length - 1) {
      const newSteps = [...steps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[index + 1]!;
      newSteps[index + 1] = temp!;
      setSteps(newSteps);
    }
  };

  const handleSave = async () => {
    if (!workflow.workflow_key || !workflow.name) {
      toast.error('Vui lòng nhập Mã và Tên quy trình.');
      return;
    }

    if (steps.some((s) => !s.role)) {
      toast.error('Vui lòng điền Vai trò xử lý cho tất cả các bước.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Cập nhật versioning logic cho tương lai (MVP: cứ save thẳng, tự tạo id nếu chưa có)
      const isNew = !workflow.id;
      const wfPayload = {
        ...workflow,
        id: workflow.id || crypto.randomUUID(),
        version: workflow.version || 1,
        is_active: workflow.is_active ?? true,
      };

      const savedWf = await WorkflowRepository.saveWorkflow(
        wfPayload as Partial<ApprovalWorkflow> & { id: string },
      );

      // 2. Tính lại step_order
      let currentOrder = 1;
      const finalizedSteps = steps.map((s, idx) => {
        if (idx === 0) return { ...s, step_order: 1, workflow_id: savedWf.id };
        if (!s.is_parallel) {
          currentOrder++;
        }
        return { ...s, step_order: currentOrder, workflow_id: savedWf.id };
      });

      await WorkflowRepository.saveWorkflowSteps(savedWf.id, finalizedSteps);

      toast.success(isNew ? 'Đã tạo quy trình mới!' : 'Đã cập nhật quy trình!');
      onComplete();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Lỗi khi lưu quy trình';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Header Config */}
      <div className="p-6 bg-surface border border-default rounded-lg shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-default pb-2">
          Cấu hình chung
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mã Quy trình (Key) <span className="text-danger">*</span>
            </label>
            <Input
              value={workflow.workflow_key || ''}
              onChange={(e) =>
                setWorkflow({ ...workflow, workflow_key: e.target.value })
              }
              placeholder="VD: purchase_order_approval"
              disabled={!!workflow.id} // Không cho đổi key nếu đã tạo
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tên Quy trình <span className="text-danger">*</span>
            </label>
            <Input
              value={workflow.name || ''}
              onChange={(e) =>
                setWorkflow({ ...workflow, name: e.target.value })
              }
              placeholder="VD: Duyệt đơn mua hàng"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1">
              Mô tả
            </label>
            <Input
              value={workflow.description || ''}
              onChange={(e) =>
                setWorkflow({ ...workflow, description: e.target.value })
              }
              placeholder="Ghi chú về quy trình này..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Switch
            checked={workflow.is_active ?? true}
            onChange={(checked) =>
              setWorkflow({ ...workflow, is_active: checked })
            }
            label="Kích hoạt quy trình này"
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Các bước duyệt
        </h3>
        <p className="text-sm text-muted">
          Kéo thả hoặc dùng nút lên/xuống để thay đổi thứ tự. Các bước được đánh
          dấu "Song song" sẽ có cùng số thứ tự với bước liền trước nó.
        </p>

        <div className="mt-4">
          {steps.map((step, index) => (
            <WorkflowStepCard
              key={step.id}
              step={step}
              index={index}
              isFirst={index === 0}
              isLast={index === steps.length - 1}
              onUpdate={handleUpdateStep}
              onRemove={handleRemoveStep}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </div>

        <Button
          variant="outline"
          onClick={handleAddStep}
          className="w-full mt-4 border-dashed py-8 text-muted hover:text-foreground"
        >
          <Icon name="Plus" className="w-5 h-5 mr-2" />
          Thêm bước duyệt mới
        </Button>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-default sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 rounded-md">
        <Button variant="outline" onClick={onComplete}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && (
            <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
          )}
          Lưu quy trình
        </Button>
      </div>
    </div>
  );
}
