import { LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { memo } from 'react';

/**
 * Icon component wrapper for Lucide icons.
 * Enforces the project's icon system rules:
 *   - Default size: 20px
 *   - Default strokeWidth: 1.5
 *   - Never import lucide-react directly in feature code — use this instead.
 *
 * Usage: <Icon name="Home" />
 *        <Icon name="Package" size={16} />         ← small
 *        <Icon name="Settings" size={24} />         ← large
 */

export type IconName = keyof typeof LucideIcons;

interface IconProps extends LucideProps {
  name: IconName | string;
}

export const Icon = memo(
  ({ name, size = 20, strokeWidth = 1.5, ...props }: IconProps) => {
    // @ts-expect-error - dynamic lookup from string key
    const LucideIcon = LucideIcons[name] as React.FC<LucideProps>;

    if (!LucideIcon) {
      console.warn(`Icon "${name}" not found in lucide-react`);
      return null;
    }

    return <LucideIcon size={size} strokeWidth={strokeWidth} {...props} />;
  },
);

Icon.displayName = 'Icon';
