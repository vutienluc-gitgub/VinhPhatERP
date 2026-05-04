import { memo, lazy, Suspense } from 'react';
import type { LucideProps } from 'lucide-react';
import type * as LucideIcons from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

export type IconName =
  | keyof typeof dynamicIconImports
  | keyof typeof LucideIcons
  | (string & {});

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

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
    const LucideIcon = getLazyIcon(name);

    if (!LucideIcon) {
      if (import.meta.env.DEV) {
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
