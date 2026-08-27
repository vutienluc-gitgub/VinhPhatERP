import { describe, it, expect } from 'vitest';

import { resolveDeepLink } from './deepLinkResolver';

describe('resolveDeepLink', () => {
  it('resolves purchase order normal view', () => {
    const url = resolveDeepLink({
      entity_type: 'purchase_order',
      entity_id: 'PO-2026-001',
    });
    expect(url).toBe('/admin/purchasing/orders?id=PO-2026-001');
  });

  it('resolves purchase order approval view', () => {
    const url = resolveDeepLink({
      entity_type: 'purchase_order',
      entity_id: 'PO-2026-001',
      action: 'approve',
    });
    expect(url).toBe('/admin/purchasing/orders?action=approve&id=PO-2026-001');
  });

  it('resolves rfq', () => {
    const url = resolveDeepLink({
      entity_type: 'rfq',
      entity_id: 'RFQ-100',
    });
    expect(url).toBe('/admin/purchasing/rfq?id=RFQ-100');
  });

  it('resolves approval request', () => {
    const url = resolveDeepLink({
      entity_type: 'approval_request',
      entity_id: 'apr-123',
    });
    expect(url).toBe('/approvals?id=apr-123');
  });

  it('resolves order / sales order', () => {
    const url = resolveDeepLink({
      entity_type: 'order',
      entity_id: 'ORD-555',
    });
    expect(url).toBe('/orders?highlight=ORD-555');
  });

  it('resolves inventory stock item', () => {
    const url = resolveDeepLink({
      entity_type: 'stock_item',
      entity_id: 'FAB-01',
    });
    expect(url).toBe('/inventory?id=FAB-01');
  });

  it('resolves default notifications fallback', () => {
    const url = resolveDeepLink({
      entity_type: 'unknown_entity',
      entity_id: '123',
    });
    expect(url).toBe('/notifications');
  });
});
