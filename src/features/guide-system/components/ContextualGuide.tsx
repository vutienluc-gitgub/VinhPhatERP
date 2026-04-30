import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/components/Button';
import { Icon } from '@/shared/components/Icon';
import { Portal } from '@/shared/components/Portal';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
import type { PlaybookSection } from '@/features/guide-system/types';
import { GUIDE_MESSAGES } from '@/features/guide-system/constants/messages';
import { APP_ROUTES } from '@/features/guide-system/constants/routes';

interface ContextualGuideProps {
  activeGuides: PlaybookSection[];
}

export function ContextualGuide({ activeGuides }: ContextualGuideProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  if (!activeGuides || activeGuides.length === 0) {
    return null;
  }

  return (
    <>
      <Portal>
        {/* Nút Help Floating chuẩn BIZOS */}
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 bg-surface text-foreground border border-border rounded-full shadow-lg hover:shadow-xl hover:border-primary/50 transition-all group"
          aria-label={GUIDE_MESSAGES.CONTEXT_TITLE}
          title={GUIDE_MESSAGES.CONTEXT_TITLE}
        >
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-inverse transition-colors">
            <Icon name="HelpCircle" size={16} />
          </div>
          <span className="text-sm font-medium pr-1">
            {GUIDE_MESSAGES.CONTEXT_TITLE}
          </span>
        </button>

        {/* Right Drawer */}
        {open && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/50 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setOpen(false)}
            />

            {/* Drawer Panel */}
            <div className="relative w-[400px] max-w-full bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">
                  {GUIDE_MESSAGES.CONTEXT_TITLE}
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-muted hover:text-foreground transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              {/* Content / Danh sách Hướng dẫn */}
              <div className="flex-1 overflow-y-auto p-5">
                {activeGuides.map((section, sectionIdx) => (
                  <div
                    key={section.title}
                    className={
                      sectionIdx > 0 ? 'mt-8 pt-6 border-t border-border' : ''
                    }
                  >
                    {/* Tóm tắt Section */}
                    <div className="flex items-start gap-3 mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="mt-0.5 text-primary">
                        <Icon name="Lightbulb" size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-primary-strong mb-1">
                          {section.title}
                        </h3>
                        <p className="text-sm text-muted">
                          {GUIDE_MESSAGES.SUMMARY_DESC}
                        </p>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-4">
                      {GUIDE_MESSAGES.STEPS_TITLE}
                    </h4>
                    <div className="space-y-4">
                      {section.steps.map((step, index) => (
                        <div key={step.id} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-subtle border border-border text-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-1">
                              {step.title}
                            </h4>
                            <div className="text-sm text-muted leading-relaxed">
                              {step.content.split('\n').map((line, i) => {
                                if (line.startsWith('[CHECKLIST]')) {
                                  return (
                                    <div
                                      key={i}
                                      className="mt-3 mb-1.5 font-semibold text-primary/90 bg-primary/5 inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs"
                                    >
                                      <Icon
                                        name="ClipboardList"
                                        size={14}
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
                                      className="mt-3 mb-1.5 font-semibold text-warning bg-warning/10 inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs"
                                    >
                                      <Icon
                                        name="AlertTriangle"
                                        size={14}
                                        className="text-warning/80"
                                      />
                                      {line.replace('[WARNING]', '').trim()}
                                    </div>
                                  );
                                }
                                return (
                                  <p
                                    key={i}
                                    className={
                                      line.trim() === '' ? 'h-1.5' : 'mb-1'
                                    }
                                  >
                                    {line}
                                  </p>
                                );
                              })}
                            </div>
                            {step.actions && step.actions.length > 0 && (
                              <div className="mt-3 flex gap-3 flex-wrap">
                                {step.actions.map((action, i) => (
                                  <button
                                    key={i}
                                    className="text-xs font-semibold text-primary hover:text-primary-strong hover:underline flex items-center gap-1"
                                    onClick={() => {
                                      if (action.type === 'navigate') {
                                        setOpen(false);
                                        navigate(action.payload);
                                      }
                                    }}
                                  >
                                    {action.label}{' '}
                                    <Icon name="ArrowRight" size={12} />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-border bg-surface">
                <Button
                  variant="outline"
                  fullWidth
                  rightIcon="ArrowRight"
                  className="border-primary/20 text-primary hover:bg-primary/5"
                  onClick={() => {
                    setOpen(false);
                    const query = activeGuides[0]
                      ? `?section=${activeGuides[0].id}`
                      : '';
                    navigate(`${APP_ROUTES.GUIDE_HOME}${query}`);
                  }}
                >
                  {GUIDE_MESSAGES.VIEW_ALL_GUIDES}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Portal>
    </>
  );
}
