import { clsx } from 'clsx';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { ApprovalStep, ApprovalHistory } from '@/domains/approval/models/types';
import {
  APPROVAL_STATUS,
  APPROVAL_STATUS_VI,
} from '@/domains/approval/models/constants';
import { Icon } from '@/shared/components/Icon';

interface Props {
  steps: ApprovalStep[];
  histories: ApprovalHistory[];
  className?: string;
}

export function ApprovalTimeline({
  steps,
  histories: _histories,
  className,
}: Props) {
  const getIcon = (status: string) => {
    switch (status) {
      case APPROVAL_STATUS.APPROVED:
        return (
          <Icon
            name="CheckCircle2"
            className="w-5 h-5 text-success bg-background"
          />
        );
      case APPROVAL_STATUS.REJECTED:
        return (
          <Icon name="XCircle" className="w-5 h-5 text-danger bg-background" />
        );
      case APPROVAL_STATUS.CANCELLED:
        return <Icon name="Ban" className="w-5 h-5 text-muted bg-background" />;
      default:
        return (
          <Icon name="Clock" className="w-5 h-5 text-warning bg-background" />
        );
    }
  };

  if (!steps || steps.length === 0) return null;

  return (
    <div className={clsx('space-y-6', className)}>
      <div className="relative border-l-2 border-default ml-2.5 space-y-6">
        {steps.map((step) => {
          {
            /* In Phase 2 we can display step history if needed */
          }

          return (
            <div key={step.id} className="relative pl-6">
              <div className="absolute -left-[11px] top-1">
                {getIcon(step.status)}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Bước {step.step_order}: {step.role_name || step.role}
                  </span>
                  <span className="text-xs text-muted">
                    {APPROVAL_STATUS_VI[step.status]}
                  </span>
                </div>

                {step.approver_snapshot && (
                  <span className="text-sm text-muted">
                    Bởi: {step.approver_snapshot.name}
                  </span>
                )}

                {step.comment && (
                  <div className="mt-2 p-3 bg-surface-secondary rounded-md text-sm text-foreground">
                    "{step.comment}"
                  </div>
                )}

                {step.approved_at && (
                  <span className="text-xs text-muted mt-1">
                    Vào lúc:{' '}
                    {format(new Date(step.approved_at), 'HH:mm dd/MM/yyyy', {
                      locale: vi,
                    })}
                  </span>
                )}

                {step.deadline && step.status === APPROVAL_STATUS.PENDING && (
                  <span
                    className={clsx(
                      'text-xs mt-1 font-medium',
                      step.is_overdue ? 'text-danger' : 'text-muted',
                    )}
                  >
                    <Icon name="Timer" className="w-3 h-3 inline mr-1" />
                    {step.is_overdue ? 'Quá hạn: ' : 'Hạn duyệt: '}
                    {format(new Date(step.deadline), 'HH:mm dd/MM/yyyy', {
                      locale: vi,
                    })}
                  </span>
                )}

                {step.delegated_to_user_id && (
                  <span className="text-xs text-info mt-1 font-medium flex items-center">
                    <Icon name="Forward" className="w-3 h-3 mr-1" />
                    Đã chuyển tiếp ủy quyền
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
