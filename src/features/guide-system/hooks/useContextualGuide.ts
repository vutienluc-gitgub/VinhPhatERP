import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '@/shared/hooks/useAuth';
import type { GuideContext } from '@/features/guide-system/types';
import { buildContext } from '@/features/guide-system/engine/context';
import { resolveGuides } from '@/features/guide-system/engine/resolver';

export function useContextualGuide(
  moduleName: string,
  entityId?: string,
  state?: string,
) {
  const { profile } = useAuth();
  const location = useLocation();

  const context: GuideContext = useMemo(() => {
    return buildContext({
      role: profile?.role || null,
      pathname: location.pathname,
      module: moduleName,
      entityId: entityId || null,
      state: state || null,
    });
  }, [profile?.role, location.pathname, moduleName, entityId, state]);

  const activeGuides = useMemo(() => {
    return resolveGuides(context);
  }, [context]);

  return { context, activeGuides };
}
