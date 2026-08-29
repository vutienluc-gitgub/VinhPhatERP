import { describe, it, expect } from 'vitest';

import { resolveParticipantParty, resolveMessageSide } from '@/domain/chat';

describe('Chat Domain - Participant Party & Message Side Resolution', () => {
  it('correctly classifies internal roles (admin, manager, staff, kho)', () => {
    expect(resolveParticipantParty('admin')).toBe('internal');
    expect(resolveParticipantParty('manager')).toBe('internal');
    expect(resolveParticipantParty('staff')).toBe('internal');
    expect(resolveParticipantParty('kho')).toBe('internal');
    expect(resolveParticipantParty('accountant')).toBe('internal');
  });

  it('correctly classifies external roles (customer, driver, supplier)', () => {
    expect(resolveParticipantParty('customer')).toBe('external');
    expect(resolveParticipantParty('driver')).toBe('external');
    expect(resolveParticipantParty('supplier')).toBe('external');
    expect(resolveParticipantParty(null)).toBe('external');
    expect(resolveParticipantParty(undefined)).toBe('external');
  });

  it('on Admin Portal (Internal perspective): all internal messages align RIGHT, external align LEFT', () => {
    // Staff A sends on Admin Portal
    expect(resolveMessageSide('internal', 'internal', false)).toBe('right');
    // Staff B sends on Admin Portal (seen by Staff A) -> Still RIGHT
    expect(resolveMessageSide('internal', 'internal', false)).toBe('right');
    // Manager sends -> RIGHT
    expect(resolveMessageSide('internal', 'internal', false)).toBe('right');

    // Customer sends on Admin Portal -> LEFT
    expect(resolveMessageSide('external', 'internal', false)).toBe('left');
    // Driver sends on Admin Portal -> LEFT
    expect(resolveMessageSide('external', 'internal', false)).toBe('left');
  });

  it('on Customer/Driver Portal (External perspective): self messages align RIGHT, enterprise aligns LEFT', () => {
    // Customer sending own message
    expect(resolveMessageSide('external', 'external', true)).toBe('right');

    // Admin/Staff message received on Customer Portal -> LEFT
    expect(resolveMessageSide('internal', 'external', false)).toBe('left');
  });
});
