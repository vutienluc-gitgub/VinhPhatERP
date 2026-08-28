import { memo, lazy, Suspense, type ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Send,
  Smile,
  Paperclip,
  Search,
  X,
  ChevronDown,
  Pin,
  RotateCcw,
  CornerUpLeft,
  MessageSquare,
  Check,
  FileText,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Bot,
  ExternalLink,
  ArrowUp,
} from 'lucide-react';
import type * as LucideIcons from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

export type IconName =
  | keyof typeof dynamicIconImports
  | keyof typeof LucideIcons
  | (string & {});

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

const STATIC_ICONS: Record<string, ComponentType<LucideProps>> = {
  Send,
  send: Send,
  Smile,
  smile: Smile,
  Paperclip,
  paperclip: Paperclip,
  Search,
  search: Search,
  X,
  x: X,
  ChevronDown,
  'chevron-down': ChevronDown,
  Pin,
  pin: Pin,
  RotateCcw,
  'rotate-ccw': RotateCcw,
  CornerUpLeft,
  'corner-up-left': CornerUpLeft,
  MessageSquare,
  'message-square': MessageSquare,
  Check,
  check: Check,
  FileText,
  'file-text': FileText,
  Plus,
  plus: Plus,
  Trash2,
  'trash-2': Trash2,
  Clock,
  clock: Clock,
  Sparkles,
  sparkles: Sparkles,
  Bot,
  bot: Bot,
  ExternalLink,
  'external-link': ExternalLink,
  ArrowUp,
  'arrow-up': ArrowUp,
};

const toKebabCase = (str: string) => {
  return str
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .toLowerCase();
};

/** Cache lazy components so React.lazy() is NOT called inside render */
const lazyIconCache = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<LucideProps>>
>();

function resolveImportFn(name: string) {
  return (
    dynamicIconImports[name as keyof typeof dynamicIconImports] ||
    dynamicIconImports[toKebabCase(name) as keyof typeof dynamicIconImports]
  );
}

function getLazyIcon(name: string) {
  const cached = lazyIconCache.get(name);
  if (cached) return cached;

  const importFn = resolveImportFn(name);
  if (!importFn) return null;

  const LazyComponent = lazy(importFn);
  lazyIconCache.set(name, LazyComponent);
  return LazyComponent;
}

export const Icon = memo(
  ({ name, size = 20, strokeWidth = 1.5, ...props }: IconProps) => {
    // Fast path: Synchronous render for primary/frequent icons
    const StaticComponent = STATIC_ICONS[name];
    if (StaticComponent) {
      return (
        <StaticComponent size={size} strokeWidth={strokeWidth} {...props} />
      );
    }

    const LucideIcon = getLazyIcon(name);

    if (!LucideIcon) {
      if (import.meta.env.DEV && name !== 'Facebook') {
        console.warn(
          `Icon "${name}" not found in lucide-react/dynamicIconImports.`,
        );
      }
      return null;
    }

    return (
      <Suspense
        fallback={
          <span
            style={{ width: size, height: size, display: 'inline-block' }}
          />
        }
      >
        <LucideIcon size={size} strokeWidth={strokeWidth} {...props} />
      </Suspense>
    );
  },
);

Icon.displayName = 'Icon';
