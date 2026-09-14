import { describe, it, expect, vi, beforeEach } from 'vitest';

import { fetchChatMessages } from '@/api/chat.api';
import { untypedDb } from '@/services/supabase/client';

vi.mock('@/services/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: { user: { id: 'test' } } } }),
    },
    rpc: vi.fn(),
  },
  untypedDb: {
    rpc: vi.fn(),
  },
}));

describe('Chat Network Resilience & WebKit Load Failed Reproduction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails to catch raw WebKit network crash (TypeError: Load failed) and wraps into sanitized error', async () => {
    // Simulate WebKit/Safari fetch network disconnection or CORS failure
    const webkitNetworkError = new TypeError('Load failed');
    vi.mocked(untypedDb.rpc).mockRejectedValueOnce(webkitNetworkError);

    // Current unpatched code directly rethrows raw TypeError: Load failed without graceful wrapping
    // We expect the safe behavior: it should catch WebKit network drops and provide friendly error
    await expect(fetchChatMessages('room-123')).rejects.toThrow(
      'Không thể tải tin nhắn do mất kết nối mạng hoặc phiên hết hạn',
    );
  });
});
