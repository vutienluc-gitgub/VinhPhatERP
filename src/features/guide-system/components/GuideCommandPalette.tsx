import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';

import { Icon } from '@/shared/components/Icon';
import { Portal } from '@/shared/components/Portal';
import { getNavigationItems } from '@/app/router/routes';
import type { NavigationItem } from '@/app/router/routes';
import { PLAYBOOK_REGISTRY } from '@/features/guide-system/content/playbook-data';
import { useGuideAnalytics } from '@/features/guide-system/hooks/useGuideAnalytics';
import type { PlaybookSection, GuideStep } from '@/features/guide-system/types';
import { GUIDE_MESSAGES } from '@/features/guide-system/constants/messages';
import { APP_ROUTES } from '@/features/guide-system/constants/routes';

/* ── Helpers ── */

const removeAccents = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* ── Types ── */

interface ModuleResult {
  type: 'module';
  item: NavigationItem;
}

interface GuideResult {
  type: 'guide';
  section: PlaybookSection;
  step: GuideStep;
}

type PaletteResult = ModuleResult | GuideResult;

/* ── Fuse indexes (built once at module scope) ── */

interface FuseNavItem {
  path: string;
  label: string;
  shortLabel: string;
  description: string;
  searchLabel: string;
  searchShortLabel: string;
  searchDescription: string;
}

function buildNavIndex(): FuseNavItem[] {
  return getNavigationItems().map((item) => ({
    path: item.path,
    label: item.label,
    shortLabel: item.shortLabel,
    description: item.description,
    searchLabel: removeAccents(item.label.toLowerCase()),
    searchShortLabel: removeAccents(item.shortLabel.toLowerCase()),
    searchDescription: removeAccents(item.description.toLowerCase()),
  }));
}

interface FuseGuideItem {
  sectionId: string;
  sectionTitle: string;
  stepId: string;
  stepTitle: string;
  stepContent: string;
  searchTitle: string;
  searchContent: string;
}

function buildGuideIndex(): FuseGuideItem[] {
  const items: FuseGuideItem[] = [];
  PLAYBOOK_REGISTRY.forEach((section) => {
    section.steps.forEach((step) => {
      items.push({
        sectionId: section.id,
        sectionTitle: section.title,
        stepId: step.id,
        stepTitle: step.title,
        stepContent: step.content,
        searchTitle: removeAccents(step.title.toLowerCase()),
        searchContent: removeAccents(step.content.toLowerCase()),
      });
    });
  });
  return items;
}

const FUSE_OPTIONS_NAV = {
  keys: ['searchLabel', 'searchShortLabel', 'searchDescription'],
  threshold: 0.35,
  includeScore: true,
};

const FUSE_OPTIONS_GUIDE = {
  keys: [
    { name: 'searchTitle', weight: 2 },
    { name: 'searchContent', weight: 1 },
  ],
  threshold: 0.4,
  includeScore: true,
};

const SECTION_LABELS = {
  modules: 'Chuyển trang',
  guides: 'Hướng dẫn',
} as const;

/* ── Component ── */

export function GuideCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { trackSearch, trackAction } = useGuideAnalytics();

  // Build Fuse indexes once (singleton-like via useMemo with stable deps)
  const navFuse = useMemo(
    () => new Fuse(buildNavIndex(), FUSE_OPTIONS_NAV),
    [],
  );
  const guideFuse = useMemo(
    () => new Fuse(buildGuideIndex(), FUSE_OPTIONS_GUIDE),
    [],
  );

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

  // Track search analytics (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        trackSearch(query);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [query, trackSearch]);

  // Compute results
  const results = useMemo((): PaletteResult[] => {
    if (query.length < 1) return [];
    const q = removeAccents(query.toLowerCase().trim());
    if (!q) return [];

    const navItems = getNavigationItems();
    const moduleResults: PaletteResult[] = navFuse
      .search(q, { limit: 5 })
      .map((r) => ({
        type: 'module' as const,
        item: navItems.find((n) => n.path === r.item.path)!,
      }))
      .filter((r) => r.item);

    const guideResults: PaletteResult[] = guideFuse
      .search(q, { limit: 5 })
      .map((r) => {
        const section = PLAYBOOK_REGISTRY.find(
          (s) => s.id === r.item.sectionId,
        );
        const step = section?.steps.find((s) => s.id === r.item.stepId);
        if (!section || !step) return null;
        return { type: 'guide' as const, section, step };
      })
      .filter((r): r is GuideResult => r !== null);

    return [...moduleResults, ...guideResults];
  }, [query, navFuse, guideFuse]);

  if (!isOpen) return null;

  const moduleResults = results.filter((r) => r.type === 'module');
  const guideResults = results.filter((r) => r.type === 'guide');

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        <div className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center px-4 py-3 border-b border-border">
            <Icon name="Search" className="text-muted-foreground mr-3" />
            <input
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground/60"
              placeholder="Tìm trang, hướng dẫn... (gõ không dấu)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-surface-subtle text-[10px] font-medium text-muted-foreground uppercase">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {/* Module results */}
            {moduleResults.length > 0 && (
              <div className="space-y-1 mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {SECTION_LABELS.modules} ({moduleResults.length})
                </div>
                {moduleResults.map((r) => {
                  if (r.type !== 'module') return null;
                  return (
                    <button
                      key={r.item.path}
                      className="w-full text-left px-3 py-3 rounded-lg hover:bg-primary/5 hover:text-primary-strong transition-colors flex items-center gap-3 focus:bg-primary/10 focus:outline-none"
                      onClick={() => {
                        trackAction('palette_navigate', r.item.path);
                        setIsOpen(false);
                        setQuery('');
                        navigate(r.item.path);
                      }}
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon
                          name={r.item.icon ?? 'Component'}
                          size={16}
                          className="text-foreground"
                        />
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate">
                          {r.item.label}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {r.item.description}
                        </span>
                      </div>
                      <Icon
                        name="ArrowRight"
                        size={14}
                        className="text-muted-foreground ml-auto flex-shrink-0"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Guide results */}
            {guideResults.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {SECTION_LABELS.guides} ({guideResults.length})
                </div>
                {guideResults.map((r) => {
                  if (r.type !== 'guide') return null;
                  return (
                    <button
                      key={`${r.section.id}-${r.step.id}`}
                      className="w-full text-left px-3 py-3 rounded-lg hover:bg-primary/5 hover:text-primary-strong transition-colors flex flex-col gap-1 focus:bg-primary/10 focus:outline-none"
                      onClick={() => {
                        trackAction('search_result_click', r.step.id);
                        setIsOpen(false);
                        setQuery('');
                        navigate(
                          `${APP_ROUTES.GUIDE_HOME}?section=${r.section.id}`,
                        );
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          name="FileText"
                          size={16}
                          className="text-foreground/70"
                        />
                        <span className="font-semibold text-sm">
                          {r.step.title}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-subtle text-muted-foreground border border-border/50 ml-auto">
                          {r.section.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 pl-6">
                        {r.step.content}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {query.length >= 1 && results.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                {GUIDE_MESSAGES.SEARCH_NO_RESULTS} &quot;{query}&quot;
              </p>
            )}

            {/* Empty state */}
            {query.length === 0 && (
              <div className="px-3 py-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon name="Command" className="text-foreground" size={24} />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Tìm kiếm nhanh
                </p>
                <p className="text-xs text-muted-foreground">
                  Gõ tên trang hoặc hướng dẫn — hỗ trợ tiếng Việt không dấu
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
