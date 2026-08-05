import { useState, useEffect } from 'react';

import type { AttentionType, AttentionPolicy } from './types';

export interface UseAttentionResult {
  className: string;
  style?: React.CSSProperties;
}

const ATTENTION_CLASS_MAP: Record<AttentionType, string> = {
  highlightOnce: 'attention-highlight',
  flashUpdate: 'attention-flash',
  pulsePending: 'attention-pulse',
  shakeError: 'attention-shake',
  glowWarning: 'attention-glow',
};

const LIFECYCLE_DURATIONS: Record<AttentionType, number> = {
  highlightOnce: 2000,
  flashUpdate: 600,
  shakeError: 400,
  pulsePending: 0, // 0 means infinite
  glowWarning: 0,
};

export function useAttention(
  attention?: AttentionType | AttentionPolicy,
): UseAttentionResult {
  const [activeAttention, setActiveAttention] =
    useState<AttentionPolicy | null>(null);

  useEffect(() => {
    if (!attention) {
      setActiveAttention(null);
      return;
    }

    const policy: AttentionPolicy =
      typeof attention === 'string' ? { type: attention } : attention;
    setActiveAttention(policy);

    const defaultDuration = LIFECYCLE_DURATIONS[policy.type];
    const duration = policy.duration ?? defaultDuration;

    // If duration is greater than 0, it has a finite lifecycle
    if (duration > 0) {
      const timer = setTimeout(() => {
        setActiveAttention(null);
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [attention]);

  if (!activeAttention) {
    return { className: '' };
  }

  const className = ATTENTION_CLASS_MAP[activeAttention.type] || '';
  const style: React.CSSProperties = {};

  if (activeAttention.duration) {
    (style as React.CSSProperties & { [key: string]: string })[
      '--attention-duration'
    ] = `${activeAttention.duration}ms`;
  }

  return { className, style };
}
