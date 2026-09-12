import { describe, it, expect } from 'vitest';

import {
  SUPPLIER_CAPABILITY_CODES,
  type SupplierCapabilityCode,
  type SupplierCapability,
} from './suppliers.types';

describe('Supplier Capabilities Domain Model', () => {
  it('defines the complete standard list of capabilities', () => {
    expect(SUPPLIER_CAPABILITY_CODES).toContain('WEAVING');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('KNITTING');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('DYEING');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('PRINTING');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('SUPPLY_YARN');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('SUPPLY_GREIGE');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('SUPPLY_FINISHED_FABRIC');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('SUPPLY_CHEMICAL');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('SUPPLY_TRIM');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('LOGISTICS');
    expect(SUPPLIER_CAPABILITY_CODES).toContain('MAINTENANCE');
    expect(SUPPLIER_CAPABILITY_CODES.length).toBe(11);
  });

  it('validates capability assignment structure', () => {
    const capability: SupplierCapability = {
      id: 'cap-001',
      supplier_id: 'supp-001',
      capability_code: 'WEAVING',
      is_verified: true,
      notes: 'Xưởng 40 máy dệt kiếm',
    };

    expect(capability.supplier_id).toBe('supp-001');
    expect(capability.capability_code).toBe('WEAVING');
    expect(capability.is_verified).toBe(true);
  });

  it('correctly filters suppliers by capability in memory', () => {
    interface SupplierWithCaps {
      id: string;
      name: string;
      category: string;
      capabilities: SupplierCapabilityCode[];
    }

    const testSuppliers: SupplierWithCaps[] = [
      {
        id: 's1',
        name: 'Vải Mộc Sài Gòn',
        category: 'GREIGE',
        capabilities: ['SUPPLY_GREIGE', 'WEAVING'],
      },
      {
        id: 's2',
        name: 'Kiều Vinh',
        category: 'OUTSOURCING',
        capabilities: ['WEAVING', 'DYEING'],
      },
      {
        id: 's3',
        name: 'Sợi Thành Toàn',
        category: 'YARN',
        capabilities: ['SUPPLY_YARN'],
      },
      {
        id: 's4',
        name: 'Tấn Phát',
        category: 'FINISHED_FABRIC',
        capabilities: ['SUPPLY_FINISHED_FABRIC', 'DYEING'],
      },
    ];

    // Filter by WEAVING: Should include both s1 (GREIGE) and s2 (OUTSOURCING)
    const weavingSuppliers = testSuppliers.filter((s) =>
      s.capabilities.includes('WEAVING'),
    );
    expect(weavingSuppliers.map((s) => s.id)).toEqual(['s1', 's2']);

    // Filter by DYEING: Should include s2 (OUTSOURCING) and s4 (FINISHED_FABRIC)
    const dyeingSuppliers = testSuppliers.filter((s) =>
      s.capabilities.includes('DYEING'),
    );
    expect(dyeingSuppliers.map((s) => s.id)).toEqual(['s2', 's4']);

    // Filter by SUPPLY_YARN
    const yarnSuppliers = testSuppliers.filter((s) =>
      s.capabilities.includes('SUPPLY_YARN'),
    );
    expect(yarnSuppliers.map((s) => s.id)).toEqual(['s3']);
  });
});
