import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock @google/genai
const mockGenerateContentStream = vi.fn();
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function (this: unknown) {
      return {
        models: {
          generateContentStream: mockGenerateContentStream,
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

import aiChatRouter from '../ai-chat';

describe('ai-chat router', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    app = new Hono();
    app.route('/chat', aiChatRouter);
  });

  it('rejects invalid request payload with 400', async () => {
    const res = await app.request('/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Dữ liệu không hợp lệ');
  });

  it('returns 503 if GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;

    const res = await app.request('/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('GEMINI_API_KEY');
  });

  it('slices messages to the 8 most recent messages when streaming', async () => {
    // Generate 12 messages
    const messages = Array.from({ length: 12 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Message ${i + 1}`,
    }));

    // Mock async iterator for generateContentStream
    mockGenerateContentStream.mockResolvedValueOnce({
      async *[Symbol.asyncIterator]() {
        yield { text: 'Phản hồi ' };
        yield { text: 'từ Gemini' };
      },
    });

    const res = await app.request('/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Accel-Buffering')).toBe('no');

    const text = await res.text();
    expect(text).toBe('Phản hồi từ Gemini');

    expect(mockGenerateContentStream).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContentStream.mock.calls[0][0];

    // Must have only 8 contents
    expect(callArgs.contents).toHaveLength(8);
    // First of the 8 should be Message 5
    expect(callArgs.contents[0].parts[0].text).toBe('Message 5');
    // Last of the 8 should be Message 12
    expect(callArgs.contents[7].parts[0].text).toBe('Message 12');
  });

  it('handles non-streaming fallback endpoint', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: 'Câu trả lời chuẩn',
    });

    const res = await app.request('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Tư vấn vải' }],
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as { reply: string };
    expect(data.reply).toBe('Câu trả lời chuẩn');
  });

  it('resolves routes correctly under both /api/v1 and /v1 prefixes', async () => {
    const rootApp = new Hono();
    const api = new Hono();
    api.route('/chat', aiChatRouter);
    rootApp.route('/api/v1', api);
    rootApp.route('/v1', api);

    const resApi = await rootApp.request('/api/v1/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    // Status 400 means route was found and payload validation ran (NOT 404 Route not found)
    expect(resApi.status).toBe(400);

    const resV1 = await rootApp.request('/v1/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    expect(resV1.status).toBe(400);
  });
});
