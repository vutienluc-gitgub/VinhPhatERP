import { describe, expect, it } from 'vitest';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { mapRollToPackingItem } from '@/application/inventory/useFinishedFabricPackingList';
import { buildPackingListPrintHtml } from '@/shared/services/print/packing-list';
import type { FinishedFabricRoll } from '@/domain/inventory/finished-fabric.types';

const roll: FinishedFabricRoll = {
  id: 'roll-1',
  roll_number: 'VP-MT-01',
  fabric_type: 'Vảy cá',
  color_name: 'Muối Tiêu',
  color_code: 'MT',
  lot_number: 'L01',
  width_cm: 160,
  length_m: 50,
  weight_kg: 23.5,
  quality_grade: 'A',
  status: 'in_stock',
  notes: 'Ghi chú',
} as unknown as FinishedFabricRoll;

describe('mapRollToPackingItem', () => {
  it('maps roll fields and converts width_cm to inch', () => {
    const packed = mapRollToPackingItem(roll, 0);
    expect(packed.roll_code).toBe('VP-MT-01');
    expect(packed.roll_sequence).toBe(1);
    expect(packed.weight_kg).toBe(23.5);
    expect(packed.color_name).toBe('Muối Tiêu');
    expect(packed.width_inch).toBeCloseTo(160 / 2.54, 3);
    expect(packed.grade).toBe('A');
  });

  it('falls back to zero weight and undefined width when null', () => {
    const bare = {
      ...roll,
      weight_kg: null,
      width_cm: null,
      quality_grade: null,
      color_name: null,
    } as unknown as FinishedFabricRoll;
    const packed = mapRollToPackingItem(bare, 4);
    expect(packed.weight_kg).toBe(0);
    expect(packed.width_inch).toBeNull();
    expect(packed.grade).toBeUndefined();
    expect(packed.roll_sequence).toBe(5);
  });
});

describe('buildPackingListPrintHtml', () => {
  const rolls: FabricRollPackingItem[] = [
    {
      id: 'r1',
      roll_code: 'VP-MT-01',
      roll_sequence: 1,
      weight_kg: 23.5,
      color_name: 'Muối Tiêu',
      fabric_type: 'Vảy cá',
      grade: 'A',
    },
    {
      id: 'r2',
      roll_code: 'VP-MT-02',
      roll_sequence: 2,
      weight_kg: 24.5,
      color_name: 'Muối Tiêu',
      fabric_type: 'Vảy cá',
      grade: 'B',
    },
  ];

  it('renders company header, document number and roll codes', () => {
    const html = buildPackingListPrintHtml(rolls, {
      documentNumber: 'PKL-999',
    });
    expect(html).toContain('CÔNG TY TNHH SX TM DỆT MAY VĨNH PHÁT');
    expect(html).toContain('BẢNG KÊ CÂY VẢI (PACKING LIST)');
    expect(html).toContain('PKL-999');
    expect(html).toContain('VP-MT-01');
    expect(html).toContain('VP-MT-02');
    expect(html).toContain('@page { size: A5 landscape;');
  });

  it('renders totals and per-group subtotal', () => {
    const html = buildPackingListPrintHtml(rolls);
    expect(html).toContain('48.0'); // total weight
    expect(html).toContain('2 cây');
    expect(html).toContain('Muối Tiêu');
  });

  it('escapes unsafe customer content', () => {
    const html = buildPackingListPrintHtml(rolls, {
      customerName: '<script>alert(1)</script>',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('handles an empty roll list without throwing', () => {
    const html = buildPackingListPrintHtml([]);
    expect(html).toContain('TỔNG CỘNG');
    expect(html).toContain('0 cây');
  });
});
