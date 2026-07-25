import React from 'react';
import { clsx } from 'clsx';

import {
  ApprovalWorkflow,
  ApprovalWorkflowStep,
} from '@/domains/approval/models/types';
import { Icon } from '@/shared/components/Icon';

interface Props {
  workflow: ApprovalWorkflow;
  steps: ApprovalWorkflowStep[];
  className?: string;
}

export function ApprovalWorkflowViewer({ workflow, steps, className }: Props) {
  if (!steps || steps.length === 0) return null;

  return (
    <div
      className={clsx(
        'p-4 bg-surface-secondary rounded-lg border border-default',
        className,
      )}
    >
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
        <Icon name="Users" className="w-4 h-4 text-muted" />
        Quy trình duyệt: {workflow.name} (v{workflow.version})
      </h3>
      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                {step.step_order}
              </div>
              <span className="text-xs font-medium mt-2 text-foreground text-center">
                {step.description || step.role}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <Icon
                name="ArrowRight"
                className="w-4 h-4 text-muted mx-2 -mt-6"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
