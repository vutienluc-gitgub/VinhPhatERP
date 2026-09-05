import { describe, it, expect } from 'vitest';

import { resolveEntityDisplayMetadata } from '@/features/chat/chat.utils';

export type SupportedChatEntityType =
  | 'customer'
  | 'shipment'
  | 'order'
  | 'work_order'
  | 'yarn_receipt'
  | 'raw_fabric';

export const SUPPORTED_CHAT_ENTITY_TYPES: readonly SupportedChatEntityType[] = [
  'customer',
  'shipment',
  'order',
  'work_order',
  'yarn_receipt',
  'raw_fabric',
] as const;

export interface EntityRecordMock {
  name?: string | null;
  code?: string | null;
  shipment_number?: string | null;
  order_number?: string | null;
  work_order_number?: string | null;
  receipt_number?: string | null;
  roll_number?: string | null;
}

describe('GOV-002: Entity Resolver Contract Test', () => {
  it('resolves valid display metadata for EVERY supported ChatEntityType', () => {
    const mockDataByType: Record<SupportedChatEntityType, EntityRecordMock> = {
      customer: { name: 'Công ty Dệt May A', code: 'KH-001' },
      shipment: { shipment_number: 'SHP-9988' },
      order: { order_number: 'ORD-5544' },
      work_order: { work_order_number: 'WO-123' },
      yarn_receipt: { receipt_number: 'RC-7788' },
      raw_fabric: { roll_number: 'R-99' },
    };

    for (const entityType of SUPPORTED_CHAT_ENTITY_TYPES) {
      const record = mockDataByType[entityType];
      const result = resolveEntityDisplayMetadata(entityType, record);

      expect(result.displayName).toBeTruthy();
      expect(result.displayName).not.toBe(`Phòng ${entityType}`);
      expect(result.displayName).not.toBe('Phòng trao đổi');
      expect(result.displayCode).toBeTruthy();
    }
  });

  it('safely falls back without throwing when record is null or entity is unknown', () => {
    const fallbackNull = resolveEntityDisplayMetadata('order', null);
    expect(fallbackNull.displayName).toBe('Phòng order');
    expect(fallbackNull.displayCode).toBe('');

    const unknownEntity = resolveEntityDisplayMetadata(
      'unknown_future_entity',
      { name: 'Test' },
    );
    expect(unknownEntity.displayName).toBe('Phòng unknown_future_entity');
    expect(unknownEntity.displayCode).toBe('');
  });
});
