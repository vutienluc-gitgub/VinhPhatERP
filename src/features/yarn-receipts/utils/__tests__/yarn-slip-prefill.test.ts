import { describe, it, expect } from 'vitest';

import type { YarnSlipScanResponse } from '@/api/yarn-receipts.api';
import {
  mapScanResultToFormValues,
  matchYarnCatalog,
} from '@/features/yarn-receipts/utils/yarn-slip-prefill';

describe('yarn-slip-prefill', () => {
  it('maps valid scan response to form values cleanly', () => {
    const mockScanResponse: YarnSlipScanResponse = {
      job_id: 'test-trace-id',
      status: 'EXTRACTED',
      extraction: {
        document: {
          document_type: 'YARN_WEIGHING_SLIP',
          supplier_raw_name: {
            value: 'CÔNG TY CP DỆT MAY ĐÔNG NAM',
            confidence: 0.98,
          },
          document_number: { value: 'PC-2026-09-001', confidence: 0.99 },
          document_date: { value: '2026-09-12', confidence: 0.99 },
          vehicle_plate: { value: '59C-123.45', confidence: 0.92 },
          customer_name: { value: 'VĨNH PHÁT', confidence: 0.95 },
          notes: { value: 'Giao đợt 1', confidence: 0.85 },
        },
        summary: {
          yarn_type: { value: 'CVC 40/1', confidence: 0.96 },
          yarn_lot: { value: 'LOT-99', confidence: 0.94 },
          package_count: { value: 10, confidence: 0.98 },
          cone_count: { value: 240, confidence: 0.95 },
          gross_weight_kg: { value: 1050.0, confidence: 0.99 },
          tare_weight_kg: { value: 50.0, confidence: 0.99 },
          declared_net_weight_kg: { value: 1000.0, confidence: 0.99 },
          calculated_net_weight_kg: 1000.0,
        },
        packages: [],
        math_discrepancies: [],
        needs_manual_review: false,
        review_reasons: [],
      },
      supplier_match: {
        rawName: 'CÔNG TY CP DỆT MAY ĐÔNG NAM',
        matchedSupplierId: '00000000-0000-0000-0000-000000000001',
        matchedSupplierName: 'Công Ty Cổ Phần Dệt May Đông Nam',
        matchedSupplierCode: 'DONGNAM',
        confidence: 0.99,
        ambiguous: false,
        candidates: [],
      },
      duplicate_guard: {
        isDuplicate: false,
        imageHash: 'abcdef1234567890',
      },
      suggested_receipt: {
        supplier_id: '00000000-0000-0000-0000-000000000001',
        supplier_name: 'Công Ty Cổ Phần Dệt May Đông Nam',
        receipt_number: 'PC-2026-09-001',
        receipt_date: '2026-09-12',
        vehicle_info: '59C-123.45',
        notes: 'Giao đợt 1',
        yarn_type: 'CVC 40/1',
        yarn_lot: 'LOT-99',
        gross_weight_kg: 1050.0,
        tare_weight_kg: 50.0,
        declared_net_weight_kg: 1000.0,
        package_count: 10,
        cone_count: 240,
      },
      validation: {
        passed: true,
        needs_manual_review: false,
        reasons: [],
      },
    };

    const formValues = mapScanResultToFormValues(mockScanResponse);

    expect(formValues.supplierId).toBe('00000000-0000-0000-0000-000000000001');
    expect(formValues.receiptNumber).toBe('PC-2026-09-001');
    expect(formValues.receiptDate).toBe('2026-09-12');
    expect(formValues.vehicleInfo).toBe('59C-123.45');
    expect(formValues.items).toHaveLength(1);
    const firstItem = formValues.items?.[0];
    expect(firstItem).toBeDefined();
    if (firstItem) {
      expect(firstItem.yarnType).toBe('CVC 40/1');
      expect(firstItem.lotNumber).toBe('LOT-99');
      expect(firstItem.quantity).toBe(1000.0);
      expect(firstItem.boxCount).toBe(10);
      expect(firstItem.conesPerBox).toBe(24);
    }
  });

  it('matches yarn catalog and assigns yarnCatalogId', () => {
    const mockCatalogs = [
      {
        id: 'cat-pe-30',
        code: 'PE-30-1',
        name: 'Sợi PE 30/1',
        composition: '100% Polyester',
        color_name: 'Trắng',
        tensile_strength: null,
        origin: 'Việt Nam',
        grade: 'A',
        unit: 'kg',
      },
      {
        id: 'cat-cvc-40',
        code: 'CVC-40-1',
        name: 'Sợi CVC 40/1 chải kỹ',
        composition: '60% Cotton 40% Poly',
        color_name: 'Mộc',
        tensile_strength: null,
        origin: 'Việt Nam',
        grade: 'A',
        unit: 'kg',
      },
    ];

    const match1 = matchYarnCatalog('CVC 40/1', mockCatalogs);
    expect(match1.matchedCatalogId).toBe('cat-cvc-40');
    expect(match1.confidence).toBeGreaterThan(0.7);

    const match2 = matchYarnCatalog('PE-30-1', mockCatalogs);
    expect(match2.matchedCatalogId).toBe('cat-pe-30');
    expect(match2.confidence).toBe(1.0);

    const matchUnknown = matchYarnCatalog('Lụa tơ tằm 100%', mockCatalogs);
    expect(matchUnknown.matchedCatalogId).toBeNull();
    expect(matchUnknown.ambiguous).toBe(true);
  });

  it('maps individual package breakdown items when breakdownByPackages is true', () => {
    const mockScanWithPackages: YarnSlipScanResponse = {
      job_id: 'job-multi-pkg',
      status: 'EXTRACTED',
      extraction: {
        document: {
          document_type: 'YARN_WEIGHING_SLIP',
          supplier_raw_name: { value: 'NCC A', confidence: 0.9 },
          document_number: { value: 'PC-001', confidence: 0.9 },
          document_date: { value: '2026-09-12', confidence: 0.9 },
          vehicle_plate: { value: null, confidence: 0 },
          customer_name: { value: null, confidence: 0 },
          notes: { value: null, confidence: 0 },
        },
        summary: {
          yarn_type: { value: 'PE 30/1', confidence: 0.95 },
          yarn_lot: { value: 'LOT-A', confidence: 0.95 },
          package_count: { value: 2, confidence: 0.95 },
          cone_count: { value: 48, confidence: 0.95 },
          gross_weight_kg: { value: 104, confidence: 0.95 },
          tare_weight_kg: { value: 4, confidence: 0.95 },
          declared_net_weight_kg: { value: 100, confidence: 0.95 },
          calculated_net_weight_kg: 100,
        },
        packages: [
          {
            package_index: 1,
            package_code: 'BOX-01',
            item_type: 'BOX',
            cone_count: 24,
            gross_kg: 52,
            tare_kg: 2,
            net_kg: 50,
            confidence: 0.98,
            is_outlier: false,
          },
          {
            package_index: 2,
            package_code: 'BOX-02',
            item_type: 'BOX',
            cone_count: 24,
            gross_kg: 52,
            tare_kg: 2,
            net_kg: 50,
            confidence: 0.98,
            is_outlier: false,
          },
        ],
        math_discrepancies: [],
        needs_manual_review: false,
        review_reasons: [],
      },
      supplier_match: {
        rawName: 'NCC A',
        matchedSupplierId: 'sup-1',
        matchedSupplierName: 'Nhà cung cấp A',
        matchedSupplierCode: 'NCC_A',
        confidence: 0.9,
        ambiguous: false,
        candidates: [],
      },
      duplicate_guard: { isDuplicate: false, imageHash: 'hash-1' },
      suggested_receipt: {
        supplier_id: 'sup-1',
        supplier_name: 'Nhà cung cấp A',
        receipt_number: 'PC-001',
        receipt_date: '2026-09-12',
        vehicle_info: null,
        notes: null,
        yarn_type: 'PE 30/1',
        yarn_lot: 'LOT-A',
        gross_weight_kg: 104,
        tare_weight_kg: 4,
        declared_net_weight_kg: 100,
        package_count: 2,
        cone_count: 48,
      },
      validation: { passed: true, needs_manual_review: false, reasons: [] },
    };

    const formValues = mapScanResultToFormValues(mockScanWithPackages, {
      breakdownByPackages: true,
    });

    expect(formValues.items).toHaveLength(2);
    const item1 = formValues.items?.[0];
    const item2 = formValues.items?.[1];
    expect(item1).toBeDefined();
    expect(item2).toBeDefined();
    if (item1 && item2) {
      expect(item1.boxNo).toBe('BOX-01');
      expect(item1.quantity).toBe(50);
      expect(item2.boxNo).toBe('BOX-02');
      expect(item2.quantity).toBe(50);
    }
  });
});
