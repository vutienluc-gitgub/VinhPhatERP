import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { useAIChatStream } from '@/features/chat/hooks/useAIChatStream';
import { Icon } from '@/shared/components/Icon';

interface AIChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  'Tra cứu quy trình dệt nhuộm vải thô',
  'Kiểm tra định mức tiêu hao sợi',
  'Hướng dẫn xử lý vải bị lỗi loang màu',
  'Quy trình xuất nhập kho tiêu chuẩn ERP',
];

export const AIChatDrawer = React.memo(function AIChatDrawer({
  open,
  onClose,
}: AIChatDrawerProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    stopStream,
    clearMessages,
  } = useAIChatStream();

  const [isCopied, setIsCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView?.({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Auto-scroll when messages update or stream updates
  useEffect(() => {
    if (open) {
      scrollToBottom(true);
    }
  }, [messages, open, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, [open]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !isStreaming && input.trim()) {
        void sendMessage();
      }
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(id);
      setTimeout(() => setIsCopied(null), 2000);
    } catch {
      // Ignore copy error
    }
  };

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-foreground/50 z-[120] transition-opacity backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-chat-drawer-title"
        className="fixed inset-y-0 right-0 z-[120] w-full sm:max-w-md bg-surface border-l border-border shadow-2xl flex flex-col transition-transform animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <header className="px-4 py-3.5 border-b border-border bg-surface-secondary/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="Sparkles" size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2
                  id="ai-chat-drawer-title"
                  className="text-sm font-semibold text-foreground truncate m-0"
                >
                  Trợ lý AI Vịnh Phát
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-medium shrink-0">
                  Gemini 3.6
                </span>
              </div>
              <p className="text-[11px] text-muted truncate m-0">
                Streaming phản hồi · Giới hạn 8 tin gần nhất
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearMessages}
              title="Xóa hội thoại"
              aria-label="Xóa hội thoại"
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface-secondary rounded-lg transition-colors border-none bg-transparent cursor-pointer"
            >
              <Icon name="Trash2" size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng hộp chat"
              aria-label="Đóng hộp chat"
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface-secondary rounded-lg transition-colors border-none bg-transparent cursor-pointer"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        </header>

        {/* Message timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="Bot" size={15} />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-br-xs'
                      : 'bg-surface-secondary text-foreground border border-border/70 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                    {msg.isStreaming && (
                      <span
                        className="inline-block w-1.5 h-3.5 ml-1 bg-primary align-middle animate-pulse"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Actions for assistant messages */}
                  {!isUser && !msg.isStreaming && msg.content && (
                    <div className="mt-1.5 pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted">
                      <span>Vinh Phat AI</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 hover:text-foreground border-none bg-transparent cursor-pointer rounded transition-colors"
                        aria-label="Sao chép nội dung"
                      >
                        {isCopied === msg.id ? (
                          <span className="text-success text-[10px]">
                            Đã sao chép
                          </span>
                        ) : (
                          <Icon name="FileText" size={13} />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-surface-secondary text-foreground border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="User" size={15} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading indicator when waiting for first token */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="Bot" size={15} />
              </div>
              <div className="bg-surface-secondary border border-border/70 rounded-2xl rounded-bl-xs px-3.5 py-2.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                <span className="text-xs text-muted ml-1.5">
                  AI đang tạo câu trả lời...
                </span>
              </div>
            </div>
          )}

          {/* Quick suggestions when history is short */}
          {messages.length <= 1 && !isLoading && (
            <div className="pt-2">
              <p className="text-xs text-muted mb-2 font-medium">
                Gợi ý câu hỏi nhanh:
              </p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void sendMessage(item)}
                    className="text-left text-xs p-2 rounded-xl border border-border/70 bg-surface-secondary/40 hover:bg-surface-secondary hover:text-primary transition-colors text-foreground cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-danger/10 text-danger text-xs border border-danger/20 flex items-center gap-2">
              <Icon name="X" size={15} className="shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <footer className="p-3 border-t border-border bg-surface shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="relative rounded-xl border border-border bg-surface-secondary/30 focus-within:border-primary transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi cho Trợ lý AI (Enter để gửi)..."
              disabled={isLoading}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted p-2.5 pr-20 resize-none border-none outline-none focus:ring-0 max-h-32"
            />

            <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStream}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-secondary hover:bg-danger/10 hover:text-danger text-foreground text-xs font-medium flex items-center gap-1 border border-border transition-colors cursor-pointer"
                  title="Dừng phản hồi"
                  aria-label="Dừng phản hồi"
                >
                  <Icon name="Square" size={13} />
                  <span>Dừng</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity border-none cursor-pointer flex items-center justify-center shadow-xs"
                  title="Gửi tin nhắn"
                  aria-label="Gửi tin nhắn"
                >
                  <Icon name="Send" size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-muted">
            <span>Shift + Enter để xuống dòng</span>
            <span>Tối đa 8 tin nhắn gần nhất</span>
          </div>
        </footer>
      </div>
    </>,
    document.body,
  );
});

AIChatDrawer.displayName = 'AIChatDrawer';
