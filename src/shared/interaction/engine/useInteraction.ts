import { useMemo } from 'react';

import { interactionRegistry } from '@/shared/interaction/registry';
import { useInteractionEnvironment } from '@/shared/interaction/engine/InteractionProvider';
import type {
  InteractionDomain,
  InteractionConfig,
  InteractionIntent,
} from '@/shared/interaction/engine/types';

export interface UseInteractionResult extends InteractionConfig {
  /** Applied to the row/card wrapper */
  wrapperClassName: string;
  /** Inline styles for CSS variables */
  style: React.CSSProperties;
  /** Whether the device prefers reduced motion */
  reducedMotion: boolean;
  /** The density setting from context */
  density: string;
}

export function useInteraction(
  domain: InteractionDomain,
  intent: InteractionIntent = 'default',
): UseInteractionResult {
  const env = useInteractionEnvironment();
  const config = interactionRegistry[domain];

  return useMemo(() => {
    let finalAccent = config.accent;

    // Apply Context-aware override based on intent
    if (intent === 'danger') finalAccent = 'var(--danger-rgb)';
    else if (intent === 'success') finalAccent = 'var(--success-rgb)';
    else if (intent === 'warning') finalAccent = 'var(--warning-rgb)';
    else if (intent === 'info') finalAccent = 'var(--brand-rgb)';

    // Determine the base classes based on variant
    let wrapperClassName = 'interaction-base group relative transition-colors ';

    // Density adjustments
    if (env.density === 'compact') {
      wrapperClassName += 'py-1 ';
    } else if (env.density === 'comfortable') {
      wrapperClassName += 'py-3 ';
    }

    if (config.variant === 'detail') {
      wrapperClassName +=
        'cursor-pointer hover:bg-[rgba(var(--interaction-rgb),0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--interaction-rgb),0.3)] ';
      // Add a scale effect for touch devices to replace hover
      if (env.density === 'touch') {
        wrapperClassName +=
          'active:scale-[0.99] active:bg-[rgba(var(--interaction-rgb),0.1)] ';
      }
    } else if (config.variant === 'selectable') {
      wrapperClassName +=
        'cursor-pointer hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ';
    }

    const style: React.CSSProperties & { [key: string]: string | number } = {};
    if (config.variant === 'detail') {
      style['--interaction-rgb'] = finalAccent
        .replace('var(', '')
        .replace(')', '');
    }

    return {
      ...config,
      accent: finalAccent,
      wrapperClassName: wrapperClassName.trim(),
      style,
      reducedMotion: env.motionPreference === 'reduced',
      density: env.density,
    };
  }, [config, env, intent]);
}
