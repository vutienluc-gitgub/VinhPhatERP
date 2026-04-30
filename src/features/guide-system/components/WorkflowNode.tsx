import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import type { GuideStep } from '@/features/guide-system/types';
import { useGuideAnalytics } from '@/features/guide-system/hooks/useGuideAnalytics';

interface WorkflowNodeProps {
  step: GuideStep;
  index: number;
  isLast: boolean;
}

export function WorkflowNode({ step, index, isLast }: WorkflowNodeProps) {
  const navigate = useNavigate();
  const { trackAction } = useGuideAnalytics();

  return (
    <div id={`step-${step.id}`} className="relative pl-10 py-4">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-[11px] top-10 bottom-0 w-0.5 bg-border/50" />
      )}

      {/* Node Bullet */}
      <div className="absolute left-0 top-5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-inverse text-xs font-bold shadow-sm z-10 ring-4 ring-background">
        {index + 1}
      </div>

      {/* Node Content */}
      <div className="panel-card bg-surface border border-border/40 p-5 rounded-xl hover:border-primary/40 transition-colors shadow-sm">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          {step.title}
        </h3>
        <div className="mt-3 text-sm text-muted leading-relaxed">
          {step.content.split('\n').map((line, i) => {
            if (line.startsWith('[CHECKLIST]')) {
              return (
                <div
                  key={i}
                  className="mt-4 mb-2 font-semibold text-primary/90 bg-primary/5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded"
                >
                  <Icon
                    name="ClipboardList"
                    size={16}
                    className="text-primary/70"
                  />
                  {line.replace('[CHECKLIST]', '').trim()}
                </div>
              );
            }
            if (line.startsWith('[WARNING]')) {
              return (
                <div
                  key={i}
                  className="mt-4 mb-2 font-semibold text-warning bg-warning/10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded"
                >
                  <Icon
                    name="AlertTriangle"
                    size={16}
                    className="text-warning/80"
                  />
                  {line.replace('[WARNING]', '').trim()}
                </div>
              );
            }
            return (
              <p key={i} className={line.trim() === '' ? 'h-2' : 'mb-1'}>
                {line}
              </p>
            );
          })}
        </div>

        {step.actions && step.actions.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {step.actions.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                leftIcon={
                  action.type === 'navigate'
                    ? 'ArrowRight'
                    : action.type === 'mutation'
                      ? 'Zap'
                      : 'ExternalLink'
                }
                onClick={async () => {
                  trackAction(action.label, action.payload);
                  if (action.type === 'navigate') {
                    navigate(action.payload);
                  } else if (action.type === 'external') {
                    window.open(action.payload, '_blank');
                  } else if (action.type === 'mutation') {
                    // In a real app, you would use a robust API client here
                    try {
                      await fetch(action.payload, { method: 'POST' });
                    } catch (error) {
                      console.error('Action mutation failed', error);
                    }
                  }
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
