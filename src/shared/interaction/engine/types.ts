import type { IconName } from '@/shared/components/Icon';

export type InteractionVariant =
  | 'passive'
  | 'selectable'
  | 'detail'
  | 'editing'
  | 'danger';

export type InteractionIntent =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface InteractionConfig {
  /** The interaction level / variant */
  variant: InteractionVariant;

  /** The semantic accent color mapped to this interaction */
  accent: string;

  /** The icon to display on hover (for 'detail' variant) */
  icon?: IconName;

  /** Motion timing token (e.g. 'standard', 'fast', 'expressive') */
  motion: 'fast' | 'standard' | 'expressive';
}

/** Pre-defined domains registered in the Interaction Engine */
export type InteractionDomain =
  | 'purchase'
  | 'supplier'
  | 'customer'
  | 'invoice'
  | 'inventory'
  | 'production'
  | 'default';

/** Phase 1.5: Attention Engine Types */
export type AttentionType =
  | 'highlightOnce'
  | 'flashUpdate'
  | 'pulsePending'
  | 'shakeError'
  | 'glowWarning';

export interface AttentionPolicy {
  type: AttentionType;
  /** Custom duration in ms. If not provided, falls back to default. */
  duration?: number;
}
