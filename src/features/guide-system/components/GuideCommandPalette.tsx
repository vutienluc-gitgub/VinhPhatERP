import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/shared/components/Icon';
import { Portal } from '@/shared/components/Portal';
import { PLAYBOOK_REGISTRY } from '@/features/guide-system/content/playbook-data';
import { useGuideAnalytics } from '@/features/guide-system/hooks/useGuideAnalytics';
import type { PlaybookSection, GuideStep } from '@/features/guide-system/types';
import { GUIDE_MESSAGES } from '@/features/guide-system/constants/messages';
import { APP_ROUTES } from '@/features/guide-system/constants/routes';

interface SearchResult {
  section: PlaybookSection;
  step: GuideStep;
  matchScore: number;
}

export function GuideCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { trackSearch, trackAction } = useGuideAnalytics();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen]);

  // Execute search when query changes (with debounce in real app, simplified here)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        trackSearch(query);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query, trackSearch]);

  if (!isOpen) return null;

  // Basic search engine
  const results: SearchResult[] = [];
  const q = query.toLowerCase();

  if (q.length >= 2) {
    PLAYBOOK_REGISTRY.forEach((section) => {
      section.steps.forEach((step) => {
        let score = 0;
        if (step.title.toLowerCase().includes(q)) score += 10;
        if (step.content.toLowerCase().includes(q)) score += 5;
        if (section.title.toLowerCase().includes(q)) score += 2;

        if (score > 0) {
          results.push({ section, step, matchScore: score });
        }
      });
    });
  }

  results.sort((a, b) => b.matchScore - a.matchScore);

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        <div className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center px-4 py-3 border-b border-border">
            <Icon name="Search" className="text-muted mr-3" />
            <input
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted/60"
              placeholder={GUIDE_MESSAGES.SEARCH_PLACEHOLDER}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-surface-subtle text-[10px] font-medium text-muted uppercase">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query.length > 0 && query.length < 2 && (
              <p className="text-center text-sm text-muted py-6">
                {GUIDE_MESSAGES.SEARCH_MIN_CHARS}
              </p>
            )}

            {query.length >= 2 && results.length === 0 && (
              <p className="text-center text-sm text-muted py-6">
                {GUIDE_MESSAGES.SEARCH_NO_RESULTS} "{query}"
              </p>
            )}

            {results.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
                  {GUIDE_MESSAGES.SEARCH_RESULTS_COUNT} ({results.length})
                </div>
                {results.map(({ section, step }) => (
                  <button
                    key={`${section.id}-${step.id}`}
                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-primary/5 hover:text-primary-strong transition-colors flex flex-col gap-1 focus:bg-primary/10 focus:outline-none"
                    onClick={() => {
                      trackAction('search_result_click', step.id);
                      setIsOpen(false);
                      // Default navigate to the guide page with the section selected
                      // In a robust implementation, could highlight the specific step
                      navigate(
                        `${APP_ROUTES.GUIDE_HOME}?section=${section.id}`,
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        name="FileText"
                        size={16}
                        className="text-primary/70"
                      />
                      <span className="font-semibold text-sm">
                        {step.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-subtle text-muted border border-border/50 ml-auto">
                        {section.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted line-clamp-1 pl-6">
                      {step.content}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {query.length === 0 && (
              <div className="px-3 py-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon name="BookOpen" className="text-primary" size={24} />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {GUIDE_MESSAGES.PALETTE_TITLE}
                </p>
                <p className="text-xs text-muted">
                  {GUIDE_MESSAGES.PALETTE_DESC}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
