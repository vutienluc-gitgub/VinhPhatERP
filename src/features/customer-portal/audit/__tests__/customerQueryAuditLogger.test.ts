import { describe, it, expect, beforeEach, vi } from 'vitest';
import { customerPortalAudit } from '../customerQueryAuditLogger';

describe('CustomerPortalAuditLogger', () => {
  beforeEach(() => {
    customerPortalAudit.clear();
  });

  it('tracks the complete lifecycle of a customer query from init to complete', () => {
    const tracker = customerPortalAudit.startQuery('customer-chat-context', {
      entityType: 'customer',
      entityId: 'cust-123',
      caller: 'useChatContext',
    });

    tracker.logCacheLookup(['chat-entity-context', 'customer', 'cust-123'], false);
    tracker.logFetch('customers', {
      select: 'id, name, code, phone',
      filters: { id: 'cust-123' },
    });

    const rawCustomer = {
      id: 'cust-123',
      name: 'Nguyễn Văn A',
      code: 'KH001',
      phone: '0989072670',
    };
    tracker.logResponse(rawCustomer, null, 1);

    const transformed = {
      id: rawCustomer.id,
      type: 'customer',
      name: rawCustomer.name,
      code: rawCustomer.code,
      phone: rawCustomer.phone,
      statusLabel: 'Khách hàng',
      detailUrl: '/customers',
      subtitle: `Mã: ${rawCustomer.code}`,
    };
    tracker.logTransform(rawCustomer, transformed, { contextType: 'customer', isPortalUser: true });
    tracker.logComplete(transformed);

    const logs = customerPortalAudit.getLogs();
    expect(logs.length).toBeGreaterThanOrEqual(5);

    const phases = logs.map((l) => l.phase);
    expect(phases).toContain('QUERY_INITIALIZED');
    expect(phases).toContain('CACHE_LOOKUP');
    expect(phases).toContain('FETCH_DISPATCHED');
    expect(phases).toContain('DATA_RECEIVED');
    expect(phases).toContain('TRANSFORMATION_APPLIED');
    expect(phases).toContain('RENDER_READY');
  });

  it('automatically flags the reversed role anomaly when statusLabel is "Khách hàng"', () => {
    const tracker = customerPortalAudit.startQuery('customer-chat-context', {
      customerId: 'cust-123',
    });

    const uiOutput = {
      statusLabel: 'Khách hàng',
      phone: '0989072670',
      detailUrl: '/customers',
      name: 'Công ty May ABC',
    };

    tracker.logTransform({}, uiOutput);

    const anomalies = customerPortalAudit.getAnomalies();
    expect(anomalies.length).toBeGreaterThan(0);
    const reversedRoleAnomaly = anomalies.find((a) => a.type === 'REVERSED_ROLE_CONTEXT');
    expect(reversedRoleAnomaly).toBeDefined();
    expect(reversedRoleAnomaly?.uiSymptom).toContain('Khách hàng');
    expect(reversedRoleAnomaly?.rootCause).toContain('useChatContext');
  });

  it('flags staff quick replies loaded in customer portal view', () => {
    const tracker = customerPortalAudit.startQuery('customer-portal-quick-replies');
    const cannedStaffReplies = [
      'Dạ em đã nhận được thông tin ạ',
      'Dạ đơn hàng đang được xử lý',
    ];

    tracker.logTransform(cannedStaffReplies, cannedStaffReplies);

    const anomalies = customerPortalAudit.getAnomalies();
    const staffReplyAnomaly = anomalies.find((a) => a.type === 'STAFF_REPLIES_IN_CUSTOMER_VIEW');
    expect(staffReplyAnomaly).toBeDefined();
    expect(staffReplyAnomaly?.suggestedFix).toContain('CUSTOMER_QUICK_REPLIES');
  });

  it('flags unscoped database queries on tenant tables', () => {
    const tracker = customerPortalAudit.startQuery('portal-orders', {
      customerId: 'cust-456',
    });

    tracker.logFetch('orders', {
      select: 'id, total_amount',
      filters: {}, // Missing customer_id filter
    });

    const anomalies = customerPortalAudit.getAnomalies();
    const unscopedAnomaly = anomalies.find((a) => a.type === 'UNSCOPED_CUSTOMER_QUERY');
    expect(unscopedAnomaly).toBeDefined();
    expect(unscopedAnomaly?.title).toContain('Unscoped query dispatched to table "orders"');
  });

  it('clears logs and anomalies on clear()', () => {
    customerPortalAudit.startQuery('test-query');
    expect(customerPortalAudit.getLogs().length).toBeGreaterThan(0);

    customerPortalAudit.clear();
    expect(customerPortalAudit.getLogs().length).toBe(0);
    expect(customerPortalAudit.getAnomalies().length).toBe(0);
  });
});
