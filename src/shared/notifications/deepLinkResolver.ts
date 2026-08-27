export interface NotificationPayloadRef {
  entity_type: string;
  entity_id: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Central Deep Link Resolver: Decouples domain notifications from URL presentation routes.
 */
export function resolveDeepLink(ref: NotificationPayloadRef): string {
  const entityType = ref.entity_type;
  const entityId = ref.entity_id;
  const action = ref.action;

  switch (entityType) {
    case 'order':
    case 'sales_order':
      return entityId
        ? `/orders?highlight=${encodeURIComponent(entityId)}`
        : '/orders';

    case 'purchase_order':
      return action === 'approve'
        ? `/admin/purchasing/orders?action=approve&id=${encodeURIComponent(entityId)}`
        : `/admin/purchasing/orders?id=${encodeURIComponent(entityId)}`;

    case 'rfq':
      return `/admin/purchasing/rfq?id=${encodeURIComponent(entityId)}`;

    case 'approval_request':
      return `/approvals?id=${encodeURIComponent(entityId)}`;

    case 'stock_item':
    case 'inventory':
      return `/inventory?id=${encodeURIComponent(entityId)}`;

    case 'payment_schedule':
    case 'debt':
      return `/debts?id=${encodeURIComponent(entityId)}`;

    case 'work_order':
    case 'production':
      return `/production/work-orders?id=${encodeURIComponent(entityId)}`;

    case 'dyeing_order':
      return `/dyeing?id=${encodeURIComponent(entityId)}`;

    default:
      return '/notifications';
  }
}
