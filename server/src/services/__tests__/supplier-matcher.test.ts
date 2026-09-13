import { describe, it, expect } from 'vitest';

import {
  SupplierMatcherService,
  type SupplierOption,
} from '../supplier-matcher.service.js';

describe('SupplierMatcherService', () => {
  const matcher = new SupplierMatcherService();

  const mockSuppliers: SupplierOption[] = [
    {
      id: 'sup-dongnam-001',
      code: 'DONGNAM',
      name: 'Công Ty Cổ Phần Dệt May Đông Nam',
    },
    {
      id: 'sup-minhdat-002',
      code: 'MINHDAT',
      name: 'Công Ty TNHH SX TM Minh Đạt',
    },
    {
      id: 'sup-khanhphong-003',
      code: 'KHANHPHONG',
      name: 'Công Ty Dệt May Khánh Phong',
    },
    {
      id: 'sup-hiepthuy-004',
      code: 'HIEPTHUY',
      name: 'Dệt Hiệp Thủy',
    },
    {
      id: 'sup-dangkhoa-005',
      code: 'DANGKHOA',
      name: 'Công Ty Cổ Phần Sợi Đăng Khoa',
    },
  ];

  it('matches YS-0001 raw name with high confidence', () => {
    const raw = 'CÔNG TY CP DỆT MAY ĐÔNG NAM';
    const result = matcher.matchSupplier(raw, mockSuppliers);

    expect(result.matchedSupplierId).toBe('sup-dongnam-001');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.ambiguous).toBe(false);
  });

  it('matches YS-0002 raw name with high confidence', () => {
    const raw = 'CÔNG TY TNHH SẢN XUẤT THƯƠNG MẠI MINH ĐẠT';
    const result = matcher.matchSupplier(raw, mockSuppliers);

    expect(result.matchedSupplierId).toBe('sup-minhdat-002');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.ambiguous).toBe(false);
  });

  it('matches YS-0004 raw name with high confidence', () => {
    const raw = 'CÔNG TY DỆT KHÁNH PHONG';
    const result = matcher.matchSupplier(raw, mockSuppliers);

    expect(result.matchedSupplierId).toBe('sup-khanhphong-003');
    expect(result.confidence).toBeGreaterThanOrEqual(0.92);
    expect(result.ambiguous).toBe(false);
  });

  it('matches YS-0006 raw name (Cơ sở Dệt Hiệp Thủy)', () => {
    const raw = 'CƠ SỞ DỆT HIỆP THỦY';
    const result = matcher.matchSupplier(raw, mockSuppliers);

    expect(result.matchedSupplierId).toBe('sup-hiepthuy-004');
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    expect(result.ambiguous).toBe(false);
  });

  it('matches exact supplier code directly', () => {
    const raw = 'Phiếu giao sợi mã DONGNAM';
    const result = matcher.matchSupplier(raw, mockSuppliers);

    expect(result.matchedSupplierId).toBe('sup-dongnam-001');
    expect(result.confidence).toBe(1.0);
    expect(result.ambiguous).toBe(false);
  });

  it('flags ambiguous match when two candidates have close scores (< 10% lead)', () => {
    const similarSuppliers: SupplierOption[] = [
      { id: 'dn-1', code: 'DN1', name: 'Công Ty Dệt Đông Nam' },
      { id: 'dn-2', code: 'DN2', name: 'Công Ty Dệt Đông Nam Á' },
    ];

    const raw = 'Công Ty Dệt Đông Nam';
    const result = matcher.matchSupplier(raw, similarSuppliers);

    // Because candidate 1 and candidate 2 have identical subset score, it must flag ambiguous
    expect(result.matchedSupplierId).toBeNull();
    expect(result.ambiguous).toBe(true);
    expect(result.candidates.length).toBeGreaterThanOrEqual(2);
  });

  it('flags ambiguous = true when confidence is below 92%', () => {
    const raw = 'Công Ty Dệt May Miền Nam Chưa Rõ Tên';
    const result = matcher.matchSupplier(raw, mockSuppliers);

    expect(result.matchedSupplierId).toBeNull();
    expect(result.ambiguous).toBe(true);
  });

  it('handles empty or null rawName safely', () => {
    const result = matcher.matchSupplier('', mockSuppliers);
    expect(result.matchedSupplierId).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.ambiguous).toBe(true);
  });
});
