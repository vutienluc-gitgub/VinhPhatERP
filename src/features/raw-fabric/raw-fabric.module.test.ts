import { describe, expect, it } from 'vitest';

import {
  bulkInputDefaults,
  bulkInputSchema,
  findDuplicateRollNumbers,
  formatBulkRollNumber,
} from '@/features/raw-fabric/raw-fabric.module';

describe('raw-fabric.module', () => {
  it('formats auto roll numbers from trimmed prefix and sequence', () => {
    expect(formatBulkRollNumber(' RM- ', 7)).toBe('RM-007');
  });

  it('detects duplicate roll numbers within a bulk batch', () => {
    const duplicates = findDuplicateRollNumbers([
      { roll_number: ' RM-001 ' },
      { roll_number: 'RM-002' },
      { roll_number: 'RM-001' },
    ]);

    expect(duplicates).toEqual(['RM-001']);
  });

  it('accepts valid bulk input and trims shared fields', () => {
    const result = bulkInputSchema.parse({
      ...bulkInputDefaults,
      fabric_type: '  Dệt thoi 60/40 TC  ',
      roll_prefix: ' RM- ',
      start_number: '5',
      warehouse_location: ' A1-R3-S2 ',
      rolls: [
        {
          roll_number: ' RM-005 ',
          weight_kg: '25.5',
          length_m: '52.2',
          quality_grade: 'A',
          notes: '  Cuộn đầu  ',
        },
        {
          roll_number: 'RM-006',
          weight_kg: '24.8',
          length_m: '',
          notes: '',
        },
      ],
    });

    expect(result.fabric_type).toBe('Dệt thoi 60/40 TC');
    expect(result.roll_prefix).toBe('RM-');
    expect(result.start_number).toBe(5);
    expect(result.warehouse_location).toBe('A1-R3-S2');
    expect(result.rolls[0]!.roll_number).toBe('RM-005');
    expect(result.rolls[0]!.weight_kg).toBe(25.5);
    expect(result.rolls[0]!.notes).toBe('Cuộn đầu');
    expect(result.rolls[1]!.length_m).toBeUndefined();
  });

  it('rejects duplicate roll numbers inside bulk input', () => {
    const result = bulkInputSchema.safeParse({
      ...bulkInputDefaults,
      fabric_type: 'Dệt thoi 60/40 TC',
      rolls: [
        {
          roll_number: 'RM-001',
          weight_kg: 25.5,
          notes: '',
        },
        {
          roll_number: ' RM-001 ',
          weight_kg: 26.1,
          notes: '',
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error(
        'Expected bulkInputSchema to reject duplicate roll numbers',
      );
    }

    expect(
      result.error.issues.some(
        (issue) => issue.path.join('.') === 'rolls.0.roll_number',
      ),
    ).toBe(true);
    expect(
      result.error.issues.some(
        (issue) => issue.path.join('.') === 'rolls.1.roll_number',
      ),
    ).toBe(true);
  });

  it('keeps stable defaults for bulk input', () => {
    expect(bulkInputDefaults.status).toBe('in_stock');
    expect(bulkInputDefaults.roll_prefix).toBe('RM-');
    expect(bulkInputDefaults.rolls[0]!.roll_number).toBe('RM-001');
  });
});
