import type {
  InteractionConfig,
  InteractionDomain,
} from '@/shared/interaction/engine/types';

export const interactionRegistry: Record<InteractionDomain, InteractionConfig> =
  {
    purchase: {
      variant: 'detail',
      accent: 'var(--domain-purchase-rgb)',
      icon: 'Package',
      motion: 'standard',
    },
    supplier: {
      variant: 'detail',
      accent: 'var(--domain-supplier-rgb)',
      icon: 'Factory',
      motion: 'standard',
    },
    customer: {
      variant: 'detail',
      accent: 'var(--domain-customer-rgb)',
      icon: 'Users',
      motion: 'standard',
    },
    invoice: {
      variant: 'detail',
      accent: 'var(--domain-invoice-rgb)',
      icon: 'Receipt',
      motion: 'standard',
    },
    inventory: {
      variant: 'detail',
      accent: 'var(--domain-customer-rgb)', // Re-using Green
      icon: 'Warehouse',
      motion: 'fast',
    },
    production: {
      variant: 'detail',
      accent: 'var(--domain-production-rgb)',
      icon: 'Settings',
      motion: 'standard',
    },
    default: {
      variant: 'selectable',
      accent: 'var(--brand-rgb)',
      motion: 'standard',
    },
  };
