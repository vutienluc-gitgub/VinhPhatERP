import { useEffect } from 'react';

import type { PlaybookSection } from '@/features/guide-system/types';
import { WorkflowNode } from '@/features/guide-system/components/WorkflowNode';
import { useGuideAnalytics } from '@/features/guide-system/hooks/useGuideAnalytics';
import { Icon } from '@/shared/components/Icon';
import { GUIDE_MESSAGES } from '@/features/guide-system/constants/messages';

interface GuideContentProps {
  section: PlaybookSection | null;
}

export function GuideContent({ section }: GuideContentProps) {
  const { trackView } = useGuideAnalytics();

  useEffect(() => {
    if (section) {
      trackView(section.id);
    }
  }, [section, trackView]);

  if (!section) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Icon name="BookOpen" size={32} className="text-primary/60" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          {GUIDE_MESSAGES.EMPTY_CONTENT_TITLE}
        </h3>
        <p className="text-muted max-w-md">
          {GUIDE_MESSAGES.EMPTY_CONTENT_DESC}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-surface">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-primary-strong tracking-tight">
            {section.title}
          </h1>
          <p className="mt-2 text-muted">
            Luồng nghiệp vụ dành cho các module:{' '}
            <span className="font-medium text-foreground">
              {section.modules.join(', ')}
            </span>
          </p>
        </header>

        <div className="space-y-2">
          {section.steps.map((step, idx) => (
            <WorkflowNode
              key={step.id}
              step={step}
              index={idx}
              isLast={idx === section.steps.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
