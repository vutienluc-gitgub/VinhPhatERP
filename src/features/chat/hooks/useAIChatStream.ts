import { useState, useRef, useCallback } from 'react';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface UseAIChatStreamOptions {
  initialMessages?: AIChatMessage[];
  systemInstruction?: string;
  apiEndpoint?: string;
}

const DEFAULT_WELCOME_MESSAGE: AIChatMessage = {
  id: 'welcome-msg',
  role: 'model',
  content:
    'Xin chào! Tôi là Trợ lý AI Vịnh Phát. Tôi có thể hỗ trợ bạn tra cứu thông tin quy trình dệt nhuộm, đơn hàng, vải mộc, sợi và xuất nhập kho. Bạn cần hỗ trợ gì hôm nay?',
  timestamp: new Date().toISOString(),
};

export function useAIChatStream({
  initialMessages,
  systemInstruction,
  apiEndpoint = '/api/v1/chat/stream',
}: UseAIChatStreamOptions = {}) {
  const [messages, setMessages] = useState<AIChatMessage[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : [DEFAULT_WELCOME_MESSAGE],
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg,
      ),
    );
  }, []);

  const sendMessage = useCallback(
    async (overrideContent?: string) => {
      const textToSend = (overrideContent ?? input).trim();
      if (!textToSend || isLoading || isStreaming) return;

      setInput('');
      setError(null);

      const userMessageId = crypto.randomUUID();
      const userMessage: AIChatMessage = {
        id: userMessageId,
        role: 'user',
        content: textToSend,
        timestamp: new Date().toISOString(),
      };

      const modelMessageId = crypto.randomUUID();
      const placeholderModelMessage: AIChatMessage = {
        id: modelMessageId,
        role: 'model',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages([...updatedMessages, placeholderModelMessage]);
      setIsLoading(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Chỉ gửi lịch sử hội thoại lên API (tối đa 8 tin nhắn gần nhất)
        const payloadHistory = updatedMessages
          .filter((m) => m.id !== 'welcome-msg')
          .slice(-8)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: payloadHistory,
            systemInstruction,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          let errorMessage = `Yêu cầu thất bại (${response.status})`;
          try {
            const errorText = await response.text();
            if (errorText) {
              try {
                const errorJson = JSON.parse(errorText) as {
                  error?: string;
                  message?: string;
                };
                errorMessage =
                  errorJson.error || errorJson.message || errorMessage;
              } catch {
                if (!errorText.trim().startsWith('<')) {
                  errorMessage = errorText;
                }
              }
            }
          } catch {
            // Không thể đọc body stream
          }

          if (response.status === 502 || response.status === 504) {
            errorMessage =
              'Máy chủ backend chưa được khởi động (Vui lòng chạy: npm run dev:all hoặc npm run dev:server).';
          } else if (response.status === 503) {
            errorMessage = errorMessage.includes('GEMINI_API_KEY')
              ? errorMessage
              : 'Dịch vụ AI tạm thời không khả dụng (503).';
          }

          throw new Error(errorMessage);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error(
            'Trình duyệt không hỗ trợ luồng phản hồi (ReadableStream).',
          );
        }

        setIsLoading(false);
        setIsStreaming(true);

        const decoder = new TextDecoder('utf-8');
        let accumulated = '';
        let isReading = true;
        while (isReading) {
          const { done, value } = await reader.read();
          if (done) {
            isReading = false;
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === modelMessageId
                ? { ...msg, content: accumulated }
                : msg,
            ),
          );
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMessageId ? { ...msg, isStreaming: false } : msg,
          ),
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User canceled stream
          return;
        }

        const errMsg =
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi khi trao đổi với AI.';
        setError(errMsg);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMessageId
              ? {
                  ...msg,
                  content: msg.content
                    ? `${msg.content}\n\n[Lỗi gián đoạn: ${errMsg}]`
                    : `[Lỗi: ${errMsg}]`,
                  isStreaming: false,
                }
              : msg,
          ),
        );
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [input, isLoading, isStreaming, messages, apiEndpoint, systemInstruction],
  );

  const clearMessages = useCallback(() => {
    stopStream();
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setError(null);
  }, [stopStream]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    stopStream,
    clearMessages,
  };
}
