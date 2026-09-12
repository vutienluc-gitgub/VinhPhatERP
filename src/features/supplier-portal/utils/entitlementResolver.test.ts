import { describe, it, expect } from 'vitest';

import { resolveSupplierEntitlements } from './entitlementResolver';

describe('Supplier Entitlement Resolver Engine', () => {
  it('resolves entitlements for a pure manufacturing subcontractor (WEAVING, DYEING)', () => {
    const entitlements = resolveSupplierEntitlements(['WEAVING', 'DYEING']);

    expect(entitlements.has('VIEW_WORK_ORDER')).toBe(true);
    expect(entitlements.has('CONFIRM_MATERIAL')).toBe(true);
    expect(entitlements.has('VIEW_DEBT')).toBe(true);
    expect(entitlements.has('SUBMIT_INVOICE')).toBe(true);

    // Should NOT have commodity PO / RFQ access
    expect(entitlements.has('VIEW_PO')).toBe(false);
    expect(entitlements.has('VIEW_RFQ')).toBe(false);
  });

  it('resolves entitlements for a pure commodity supplier (SUPPLY_YARN)', () => {
    const entitlements = resolveSupplierEntitlements(['SUPPLY_YARN']);

    expect(entitlements.has('VIEW_PO')).toBe(true);
    expect(entitlements.has('VIEW_RFQ')).toBe(true);
    expect(entitlements.has('CONFIRM_DELIVERY')).toBe(true);
    expect(entitlements.has('VIEW_DEBT')).toBe(true);
    expect(entitlements.has('SUBMIT_INVOICE')).toBe(true);

    // Should NOT have work order access
    expect(entitlements.has('VIEW_WORK_ORDER')).toBe(false);
    expect(entitlements.has('CONFIRM_MATERIAL')).toBe(false);
  });

  it('resolves union of entitlements for a Hybrid supplier (SUPPLY_GREIGE + WEAVING)', () => {
    const entitlements = resolveSupplierEntitlements([
      'SUPPLY_GREIGE',
      'WEAVING',
    ]);

    // Should have BOTH trade entitlements and manufacturing entitlements
    expect(entitlements.has('VIEW_PO')).toBe(true);
    expect(entitlements.has('VIEW_RFQ')).toBe(true);
    expect(entitlements.has('CONFIRM_DELIVERY')).toBe(true);
    expect(entitlements.has('VIEW_WORK_ORDER')).toBe(true);
    expect(entitlements.has('CONFIRM_MATERIAL')).toBe(true);
    expect(entitlements.has('VIEW_DEBT')).toBe(true);
    expect(entitlements.has('SUBMIT_INVOICE')).toBe(true);
  });

  it('restricts PO visibility for pure logistics partners', () => {
    const entitlements = resolveSupplierEntitlements(['LOGISTICS']);

    expect(entitlements.has('CONFIRM_DELIVERY')).toBe(true);
    expect(entitlements.has('VIEW_DEBT')).toBe(true);
    expect(entitlements.has('SUBMIT_INVOICE')).toBe(true);

    // Financial PO details must be hidden from pure logistics drivers/transporters
    expect(entitlements.has('VIEW_PO')).toBe(false);
    expect(entitlements.has('VIEW_RFQ')).toBe(false);
    expect(entitlements.has('VIEW_WORK_ORDER')).toBe(false);
  });

  it('supports category fallback when capabilities list is empty', () => {
    const subcontractorFallback = resolveSupplierEntitlements(
      [],
      'OUTSOURCING',
    );
    expect(subcontractorFallback.has('VIEW_WORK_ORDER')).toBe(true);
    expect(subcontractorFallback.has('CONFIRM_MATERIAL')).toBe(true);

    const traderFallback = resolveSupplierEntitlements([], 'FINISHED_FABRIC');
    expect(traderFallback.has('VIEW_PO')).toBe(true);
    expect(traderFallback.has('VIEW_RFQ')).toBe(true);

    const safeDefault = resolveSupplierEntitlements([], undefined);
    expect(safeDefault.has('VIEW_PO')).toBe(true);
    expect(safeDefault.has('VIEW_DEBT')).toBe(true);
  });
});
