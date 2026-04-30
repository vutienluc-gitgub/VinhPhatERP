import type { GuideContext } from '@/features/guide-system/types';

export interface BuildContextParams {
  role: string | null;
  pathname: string;
  module: string | null;
  entityId: string | null;
  state: string | null;
}

export function buildContext(params: BuildContextParams): GuideContext {
  // In the future, this can be expanded to infer module/state from pathname if not provided explicitly
  return {
    role: params.role,
    module: params.module,
    entityId: params.entityId,
    state: params.state,
  };
}
