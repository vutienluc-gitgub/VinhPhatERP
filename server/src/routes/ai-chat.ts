import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

const router = new Hono();

const messageSchema = z.object({
  role: z.enum(['user', 'model', 'assistant']),
  content: z.string().trim().min(1, 'Nội dung tin nhắn không được để trống'),
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1, 'Cần ít nhất một tin nhắn'),
  systemInstruction: z.string().optional(),
});

const DEFAULT_SYSTEM_INSTRUCTION = `Bạn là Trợ lý AI thông minh của Công ty TNHH SX TM Dệt May Vịnh Phát (Vinh Phat ERP).
Nhiệm vụ của bạn:
- Hỗ trợ nhân viên và khách hàng giải đáp thông tin về quy trình sản xuất dệt nhuộm, đơn hàng, vải mộc, sợi, hóa đơn và xuất nhập kho.
- Luôn phản hồi lịch sự, chính xác, ngắn gọn và hữu ích bằng tiếng Việt.
- Định dạng câu trả lời rõ ràng (dùng gạch đầu dòng, bảng số liệu khi cần).
- Nếu không chắc chắn về số liệu mật hoặc nội bộ, hãy khuyên người dùng liên hệ phòng quản lý hoặc tra cứu trực tiếp trên hệ thống ERP.`;

/**
 * POST /api/v1/chat/stream
 * Stream Gemini AI response chunk-by-chunk using generateContentStream.
 * Tự động giới hạn lịch sử hội thoại lấy 8 tin nhắn gần nhất.
 */
router.post(
  '/stream',
  zValidator('json', chatRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Dữ liệu không hợp lệ',
          details: result.error.flatten(),
        },
        400,
      );
    }
  }),
  async (c) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return c.json(
        {
          error:
            'GEMINI_API_KEY chưa được cấu hình trong biến môi trường máy chủ.',
        },
        503,
      );
    }

    const { messages, systemInstruction } = c.req.valid('json');

    // Giới hạn lịch sử hội thoại gửi lên Gemini API: chỉ lấy tối đa 8 tin nhắn gần nhất
    const recentMessages = messages.slice(-8);

    const formattedContents = recentMessages.map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : msg.role,
      parts: [{ text: msg.content }],
    }));

    // Thiết lập header chống đệm proxy (Nginx / Cloudflare) để stream mượt mà
    c.header('X-Accel-Buffering', 'no');
    c.header('Cache-Control', 'no-cache, no-transform');

    const ai = new GoogleGenAI({ apiKey });

    return streamText(c, async (stream) => {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: 'gemini-3.6-flash',
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
          },
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            await stream.write(text);
          }
        }
      } catch (err) {
        console.error('[AIChatStream error]', err);
        const message =
          err instanceof Error ? err.message : 'Không thể kết nối đến AI';
        await stream.write(`\n[Lỗi kết nối AI: ${message}]`);
      }
    });
  },
);

/**
 * POST /api/v1/chat
 * Phản hồi non-streaming (dự phòng)
 */
router.post(
  '/',
  zValidator('json', chatRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Dữ liệu không hợp lệ',
          details: result.error.flatten(),
        },
        400,
      );
    }
  }),
  async (c) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return c.json(
        {
          error:
            'GEMINI_API_KEY chưa được cấu hình trong biến môi trường máy chủ.',
        },
        503,
      );
    }

    const { messages, systemInstruction } = c.req.valid('json');

    // Giới hạn 8 tin nhắn gần nhất
    const recentMessages = messages.slice(-8);

    const formattedContents = recentMessages.map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : msg.role,
      parts: [{ text: msg.content }],
    }));

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
        },
      });

      return c.json({
        reply: response.text ?? '',
      });
    } catch (err) {
      console.error('[AIChat error]', err);
      const message =
        err instanceof Error ? err.message : 'Không thể kết nối đến AI';
      return c.json({ error: message }, 500);
    }
  },
);

export default router;
