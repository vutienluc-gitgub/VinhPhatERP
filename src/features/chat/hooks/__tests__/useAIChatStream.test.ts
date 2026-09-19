import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAIChatStream } from '@/features/chat/hooks/useAIChatStream';

describe('useAIChatStream hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default welcome message', () => {
    const { result } = renderHook(() => useAIChatStream());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.role).toBe('model');
    expect(result.current.messages[0]?.content).toContain(
      'Trợ lý AI Vịnh Phát',
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sends message and handles readable stream response', async () => {
    const streamChunks = ['Xin ', 'chào ', 'bạn!'];
    const encoder = new TextEncoder();

    const mockStream = new ReadableStream({
      start(controller) {
        for (const chunk of streamChunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    });
    vi.stubGlobal('fetch', mockFetch);

    const { result } = renderHook(() => useAIChatStream());

    await act(async () => {
      await result.current.sendMessage('Kiểm tra tồn kho vải');
    });

    // 1 welcome + 1 user + 1 model
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[1]?.role).toBe('user');
    expect(result.current.messages[1]?.content).toBe('Kiểm tra tồn kho vải');
    expect(result.current.messages[2]?.role).toBe('model');
    expect(result.current.messages[2]?.content).toBe('Xin chào bạn!');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const fetchBody = JSON.parse(String(callArgs?.[1]?.body ?? '{}'));
    // Payload should only contain user message (welcome message is omitted from history)
    expect(fetchBody.messages).toHaveLength(1);
    expect(fetchBody.messages[0]?.content).toBe('Kiểm tra tồn kho vải');
  });

  it('limits chat history to 8 most recent messages', async () => {
    const encoder = new TextEncoder();
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('OK'));
            controller.close();
          },
        }),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    // Initial messages with 10 existing messages
    const initialMessages = Array.from({ length: 10 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? ('user' as const) : ('model' as const),
      content: `Old message ${i}`,
      timestamp: new Date().toISOString(),
    }));

    const { result } = renderHook(() => useAIChatStream({ initialMessages }));

    await act(async () => {
      await result.current.sendMessage('Tin nhắn mới thứ 11');
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const fetchBody = JSON.parse(String(callArgs?.[1]?.body ?? '{}'));
    // Must be capped at 8 messages
    expect(fetchBody.messages).toHaveLength(8);
    // The last message should be the new 11th message
    expect(fetchBody.messages[7]?.content).toBe('Tin nhắn mới thứ 11');
    // The first message in payload should be Old message 3 (11 - 8 = index 3)
    expect(fetchBody.messages[0]?.content).toBe('Old message 3');
  });

  it('clears messages back to welcome message', () => {
    const { result } = renderHook(() => useAIChatStream());

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.id).toBe('welcome-msg');
  });
});
