import { ApprovalWorkflowStep } from '@/domains/approval/models/types';
import { Icon } from '@/shared/components/Icon';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Switch } from '@/shared/components/Switch';
import { VPSelect } from '@/shared/components/VPSelect';

import { ConditionEditor } from './ConditionEditor';

interface WorkflowStepCardProps {
  step: Partial<ApprovalWorkflowStep> & { id: string };
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (
    id: string,
    field: keyof ApprovalWorkflowStep,
    value: unknown,
  ) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function WorkflowStepCard({
  step,
  index,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: WorkflowStepCardProps) {
  return (
    <div className="relative p-5 border border-default rounded-lg bg-surface shadow-sm mb-4 transition-all hover:shadow-md">
      {/* Node order badge */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md">
        {index + 1}
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Vai trò xử lý (Role) <span className="text-danger">*</span>
              </label>
              <Input
                value={step.role || ''}
                onChange={(e) => onUpdate(step.id, 'role', e.target.value)}
                placeholder="VD: manager, director..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tên hiển thị (Role Name)
              </label>
              <Input
                value={step.description || ''}
                onChange={(e) =>
                  onUpdate(step.id, 'description', e.target.value)
                }
                placeholder="VD: Quản lý trực tiếp"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={step.is_parallel || false}
              onChange={(checked) => onUpdate(step.id, 'is_parallel', checked)}
              label="Duyệt song song"
              description="Bước này sẽ chạy cùng lúc với bước liền trước nó"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={isFirst}
              onClick={() => onMoveUp(step.id)}
            >
              <Icon name="ArrowUp" className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={isLast}
              onClick={() => onMoveDown(step.id)}
            >
              <Icon name="ArrowDown" className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(step.id)}
            className="text-danger border-danger/50 hover:bg-danger-soft"
          >
            <Icon name="Trash2" className="w-4 h-4 mr-1" />
            Xóa
          </Button>
        </div>
      </div>

      <div className="pt-4 border-t border-default mt-4 mb-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Cấu hình SLA & Xử lý quá hạn
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Thời gian tối đa (Giờ)
            </label>
            <Input
              type="number"
              value={step.sla_hours || ''}
              onChange={(e) =>
                onUpdate(
                  step.id,
                  'sla_hours',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              placeholder="VD: 24 (Bỏ trống = Không giới hạn)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Hành động khi quá hạn
            </label>
            <VPSelect
              value={step.escalation_action || 'notify'}
              onValueChange={(val) =>
                onUpdate(step.id, 'escalation_action', val)
              }
              options={[
                { value: 'notify', label: 'Chỉ thông báo' },
                { value: 'auto_approve', label: 'Tự động Duyệt' },
                { value: 'auto_reject', label: 'Tự động Từ chối' },
                { value: 'escalate_role', label: 'Chuyển người duyệt' },
              ]}
              placeholder="Chọn hành động"
            />
          </div>
          {step.escalation_action === 'escalate_role' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Role thay thế <span className="text-danger">*</span>
              </label>
              <Input
                value={step.escalation_role || ''}
                onChange={(e) =>
                  onUpdate(step.id, 'escalation_role', e.target.value)
                }
                placeholder="VD: admin, director"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <ConditionEditor
          condition={step.conditions || null}
          onChange={(cond) => onUpdate(step.id, 'conditions', cond)}
        />
      </div>
    </div>
  );
}
