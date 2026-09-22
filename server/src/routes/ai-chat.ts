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

const DEFAULT_SYSTEM_INSTRUCTION = `Bạn là Trợ lý AI thông minh của Công ty TNHH SX TM Dệt May Vĩnh Phát (Vinh Phat ERP).
Nhiệm vụ của bạn:
- Hỗ trợ nhân viên và khách hàng giải đáp thông tin về quy trình sản xuất dệt nhuộm, đơn hàng, vải mộc, sợi, hóa đơn và xuất nhập kho.
- Luôn phản hồi lịch sự, chính xác, ngắn gọn và hữu ích bằng tiếng Việt.
- Định dạng câu trả lời rõ ràng (dùng gạch đầu dòng, bảng số liệu khi cần).
- Nếu không chắc chắn về số liệu mật hoặc nội bộ, hãy khuyên người dùng liên hệ phòng quản lý hoặc tra cứu trực tiếp trên hệ thống ERP.`;

const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash'];

function formatAIError(err: unknown): string {
  if (err instanceof Error) {
    const raw = err.message;
    if (
      raw.includes('503') ||
      raw.includes('UNAVAILABLE') ||
      raw.includes('high demand')
    ) {
      return 'Hệ thống AI đang chịu tải cao tạm thời. Vui lòng gửi lại câu hỏi sau giây lát.';
    }
    if (raw.includes('API key') || raw.includes('invalid_grant')) {
      return 'Khóa API AI không hợp lệ. Vui lòng kiểm tra cấu hình máy chủ.';
    }
    return raw;
  }
  return 'Không thể kết nối đến AI. Vui lòng thử lại sau.';
}

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
      let streamedAny = false;
      let lastError: unknown = null;

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents: formattedContents,
            config: {
              systemInstruction:
                systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
            },
          });

          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              await stream.write(text);
              streamedAny = true;
            }
          }
          return;
        } catch (err) {
          lastError = err;
          if (streamedAny) {
            break;
          }
          // eslint-disable-next-line no-console
          console.warn(
            `[AIChatStream] Model ${modelName} gặp sự cố, chuyển model dự phòng...`,
            err,
          );
        }
      }

      if (lastError) {
        // eslint-disable-next-line no-console
        console.error('[AIChatStream error]', lastError);
        const userFriendlyMessage = formatAIError(lastError);
        await stream.write(`\n[Lỗi kết nối AI: ${userFriendlyMessage}]`);
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

    let lastError: unknown = null;
    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
          },
        });

        return c.json({
          reply: response.text ?? '',
        });
      } catch (err) {
        lastError = err;
        // eslint-disable-next-line no-console
        console.warn(
          `[AIChat] Model ${modelName} gặp sự cố, chuyển model dự phòng...`,
          err,
        );
      }
    }

    // eslint-disable-next-line no-console
    console.error('[AIChat error]', lastError);
    const message = formatAIError(lastError);
    return c.json({ error: message }, 500);
  },
);

export default router;
