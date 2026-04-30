import { memo, useState, useEffect } from 'react';

import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils/cn';
import type { PlaybookSection } from '@/features/guide-system/types';
import { GUIDE_MESSAGES } from '@/features/guide-system/constants/messages';

interface GuideSidebarProps {
  sections: PlaybookSection[];
  activeSectionId: string | null;
  onSelect: (id: string) => void;
  onClose?: () => void;
}

export const GuideSidebar = memo(function GuideSidebar({
  sections,
  activeSectionId,
  onSelect,
  onClose,
}: GuideSidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(activeSectionId ? [activeSectionId] : []),
  );

  useEffect(() => {
    if (activeSectionId) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(activeSectionId);
        return next;
      });
    }
  }, [activeSectionId]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStepClick = (stepId: string) => {
    const el = document.getElementById(`step-${stepId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // On mobile, close drawer after clicking a step
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <aside className="w-full md:w-64 border-r border-border bg-surface-subtle flex flex-col h-full">
      <div className="h-14 px-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="BookOpen" size={20} className="text-primary" />
          <h2 className="font-bold text-lg text-primary-strong tracking-tight">
            {GUIDE_MESSAGES.SIDEBAR_TITLE}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label={GUIDE_MESSAGES.CLOSE_ARIA}
          >
            <Icon name="X" size={20} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1.5">
          {sections.map((section) => {
            const isActive = activeSectionId === section.id;
            const isExpanded = expanded.has(section.id);
            return (
              <div key={section.id} className="flex flex-col">
                <button
                  onClick={() => {
                    onSelect(section.id);
                    if (!isExpanded) {
                      setExpanded((prev) => new Set(prev).add(section.id));
                    }
                  }}
                  className={cn(
                    'w-full min-h-[44px] flex items-center justify-between p-3 rounded-lg text-left text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isActive
                      ? 'bg-primary text-primary-inverse shadow-sm'
                      : 'text-muted hover:bg-surface-hover hover:text-foreground',
                  )}
                >
                  <span className="truncate pr-2">{section.title}</span>
                  <div
                    className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
                    )}
                    onClick={(e) => toggleExpand(e, section.id)}
                  >
                    <Icon
                      name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                      size={16}
                      className={cn(
                        'flex-shrink-0 transition-transform duration-200',
                        isActive ? 'text-primary-inverse/80' : 'text-muted',
                      )}
                    />
                  </div>
                </button>
                {isExpanded && (
                  <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-border/50 pl-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {section.steps.map((step) => (
                      <button
                        key={step.id}
                        onClick={() => {
                          if (!isActive) onSelect(section.id);
                          setTimeout(() => handleStepClick(step.id), 100);
                        }}
                        className="text-left text-xs text-muted hover:text-foreground py-1.5 px-2 rounded hover:bg-surface-hover transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary truncate"
                      >
                        {step.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
});
