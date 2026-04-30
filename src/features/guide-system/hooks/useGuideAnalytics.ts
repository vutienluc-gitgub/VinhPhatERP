import { useCallback } from 'react';

import { logger } from '@/shared/utils/logger';

export function useGuideAnalytics() {
  const trackView = useCallback((sectionId: string) => {
    // In a real implementation, this sends data to an analytics backend
    logger.info('guide_view', { module: 'Guide', action: 'view', sectionId });
  }, []);

  const trackAction = useCallback((actionLabel: string, payload: string) => {
    logger.info('action_click', {
      module: 'Guide',
      action: 'click',
      actionLabel,
      payload,
    });
  }, []);

  const trackSearch = useCallback((query: string) => {
    if (!query) return;
    logger.info('search_query', { module: 'Guide', action: 'search', query });
  }, []);

  return { trackView, trackAction, trackSearch };
}
