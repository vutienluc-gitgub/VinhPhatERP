import type { StatusConfig } from '@/shared/components/status/status.tokens';
import { LOOM_MESSAGES as MSG } from '@/features/looms/loom.constants';

export const activeStatus = {
  active: {
    label: MSG.STATUS_ACTIVE,
    variant: 'success',
  },
  inactive: {
    label: MSG.STATUS_INACTIVE,
    variant: 'gray',
  },
} satisfies Record<string, StatusConfig>;
