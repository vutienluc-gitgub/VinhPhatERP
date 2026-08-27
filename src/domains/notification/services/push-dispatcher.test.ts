import { describe, it, expect, vi } from 'vitest';

import { supabase } from '@/services/supabase/client';

import { sanitizePushPayloadBody, PushDispatcher } from './push-dispatcher';

vi.mock('@/services/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('push-dispatcher & sanitizePushPayloadBody', () => {
  it('masks explicit monetary amount in Vietnamese format', () => {
    const text = 'Công ty ABC còn nợ 1.250.000.000đ cần thu hồi';
    const sanitized = sanitizePushPayloadBody(text);

    expect(sanitized).toBe('Công ty ABC còn nợ *** cần thu hồi');
    expect(sanitized).not.toContain('1.250.000.000');
  });

  it('masks monetary amount with VND / USD', () => {
    const text = 'Cần thanh toán 50.000.000 VND cho đối tác';
    const sanitized = sanitizePushPayloadBody(text);

    expect(sanitized).toBe('Cần thanh toán *** cho đối tác');
  });

  it('preserves normal non-monetary text', () => {
    const text = 'Đơn hàng PO-2026-001 đã được phê duyệt bởi Giám đốc';
    const sanitized = sanitizePushPayloadBody(text);

    expect(sanitized).toBe(text);
  });

  it('dispatches sanitized payload via Supabase Edge Function', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      data: { ok: true, devices_targeted: 2 },
      error: null,
    });
    vi.mocked(supabase.functions.invoke).mockImplementation(mockInvoke);

    const success = await PushDispatcher.dispatchPush({
      user_id: 'user-123',
      domain: 'purchasing',
      type: 'po_approved',
      title: 'Đơn hàng mới',
      body: 'Giá trị đơn là 20.000.000đ',
      entity_type: 'purchase_order',
      entity_id: 'PO-100',
    });

    expect(success).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('send-web-push', {
      body: expect.objectContaining({
        user_id: 'user-123',
        title: 'Đơn hàng mới',
        body: 'Giá trị đơn là ***',
      }),
    });
  });
});
