import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

import { CHAT_LABELS, type ChatMention } from '@/schema/chat.schema';
import { uploadChatImage, uploadChatFile } from '@/shared/lib/chat-storage';
import { useMentionsSearch, type MentionOption } from '@/application/chat';

interface ChatInputAreaProps {
  onSend: (content: string, mentions?: ChatMention[]) => void;
  onSendImage?: (imageUrl: string) => void;
  onSendFile?: (fileUrl: string, fileName: string, fileType: string) => void;
  roomId?: string;
  disabled?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export function ChatInputArea({
  onSend,
  onSendImage,
  onSendFile,
  roomId,
  disabled,
  onTypingStart,
  onTypingStop,
}: ChatInputAreaProps) {
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState<ChatMention[]>([]);
  const [activeMention, setActiveMention] = useState<{
    type: 'user' | 'document';
    query: string;
    startIndex: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const { data: mentionOptions = [] } = useMentionsSearch(
    activeMention?.type ?? null,
    activeMention?.query ?? '',
  );

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojiPicker) return undefined;

    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.slice(0, start) + emoji + text.slice(end);

      setText(newText);
      setShowEmojiPicker(false);

      // Restore cursor position after emoji
      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = start + emoji.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [text],
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isUploading) return;

    // Filter mentions that actually exist in the text
    const validMentions = mentions.filter((m) => trimmed.includes(m.label));

    onSend(trimmed, validMentions.length > 0 ? validMentions : undefined);
    setText('');
    setMentions([]);
    setActiveMention(null);
    setShowEmojiPicker(false);
    onTypingStop?.();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, mentions, disabled, isUploading, onSend, onTypingStop]);

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    setPreviewFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Stop typing on blur
  const handleBlur = useCallback(() => {
    onTypingStop?.();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [onTypingStop]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Typing indicator with debounce
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (val.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStart?.();
      }, 300); // 300ms debounce
    } else {
      onTypingStop?.();
    }

    // Simple mention detection
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/(?:^|\s)([@#])(\S*)$/);

    if (match) {
      const type = match[1] === '@' ? 'user' : 'document';
      const query = match[2] ?? '';
      setActiveMention({
        type,
        query,
        startIndex: match.index! + match[0].indexOf(match[1] as string),
      });
    } else {
      setActiveMention(null);
    }
  };

  const handleSelectMention = (option: MentionOption) => {
    if (!activeMention) return;

    const prefix = option.type === 'document' ? '#' : '@';
    const mentionText = `${prefix}${option.label}`;

    const before = text.slice(0, activeMention.startIndex);
    const after = text.slice(
      activeMention.startIndex + activeMention.query.length + 1,
    );

    setText(`${before}${mentionText} ${after}`);
    setMentions((prev) => [...prev, { ...option, label: mentionText }]);
    setActiveMention(null);

    // Focus back
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!roomId) return;

      setUploadError(null);
      const objectUrl = URL.createObjectURL(file);

      setIsUploading(true);
      try {
        if (!roomId) return;

        // Check if it's an image
        if (file.type.startsWith('image/')) {
          setPreviewUrl(objectUrl);
          const result = await uploadChatImage(file, roomId as string);
          if (onSendImage) {
            onSendImage(result.publicUrl);
          }
        } else {
          // It's a file (PDF, Excel, Word)
          setPreviewFile({ url: objectUrl, name: file.name, type: file.type });
          const result = await uploadChatFile(file, roomId as string);
          if (onSendFile) {
            onSendFile(result.publicUrl, result.fileName, result.fileType);
          }
        }
        clearPreview();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : CHAT_LABELS.SEND_ERROR;
        setUploadError(message);
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(objectUrl);
      }
    },
    [roomId, onSendImage, onSendFile, clearPreview],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            void processFile(file);
          }
          return;
        }
      }
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      void processFile(file);
    },
    [processFile],
  );

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isInputDisabled = disabled || isUploading;

  return (
    <div className="chat-input-area-wrapper">
      {/* Image Preview */}
      {previewUrl && (
        <div className="chat-image-preview">
          <img src={previewUrl} alt="Preview" className="chat-preview-thumb" />
          {isUploading && (
            <span className="chat-preview-uploading">
              {CHAT_LABELS.LOADING}
            </span>
          )}
          {!isUploading && (
            <button
              type="button"
              className="chat-preview-close"
              onClick={clearPreview}
              aria-label={CHAT_LABELS.CANCEL}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* File Preview */}
      {previewFile && (
        <div className="chat-file-preview">
          <div className="chat-file-preview-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="chat-file-preview-info">
            <span className="chat-file-preview-name">{previewFile.name}</span>
            {isUploading && (
              <span className="chat-preview-uploading">
                {CHAT_LABELS.LOADING}
              </span>
            )}
          </div>
          {!isUploading && (
            <button
              type="button"
              className="chat-preview-close"
              onClick={clearPreview}
              aria-label={CHAT_LABELS.CANCEL}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Mentions Popover */}
      {activeMention && mentionOptions.length > 0 && (
        <div className="chat-mentions-popover">
          {mentionOptions.map((opt) => (
            <button
              key={`${opt.type}-${opt.id}`}
              className="chat-mention-option"
              onClick={() => handleSelectMention(opt)}
            >
              <span className="chat-mention-type">
                {opt.type === 'document'
                  ? CHAT_LABELS.MENTION_DOC_ICON
                  : CHAT_LABELS.MENTION_USER_ICON}
              </span>
              <span className="chat-mention-label">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Upload Error */}
      {uploadError && <div className="chat-upload-error">{uploadError}</div>}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="chat-emoji-picker">
          <div className="chat-emoji-grid">
            {[
              '😀',
              '😂',
              '🥰',
              '😍',
              '🤔',
              '👍',
              '👎',
              '🙏',
              '🔥',
              '❤️',
              '🎉',
              '✅',
              '⚠️',
              '❌',
              '📎',
              '📅',
              '🕐',
              '👋',
              '🤝',
              '🚀',
              '💡',
              '🔴',
              '🟢',
              '🔵',
            ].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="chat-emoji-btn"
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Row — Toolbar Architecture */}
      <div className="chat-composer">
        {/* Toolbar Left */}
        <div className="chat-composer-left">
          {onSendImage && roomId && (
            <>
              <button
                type="button"
                className="chat-attach-btn"
                onClick={handleAttachClick}
                disabled={isInputDisabled}
                aria-label={CHAT_LABELS.ATTACH_IMAGE}
                title="Tải lên tệp/hình ảnh"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => void handleFileSelect(e)}
                className="chat-file-input-hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
            </>
          )}
        </div>

        {/* Composer Central Box (Textarea + Inner Toolbar) */}
        <div className="chat-composer-input-box">
          <textarea
            ref={textareaRef}
            className="chat-input-field"
            placeholder={CHAT_LABELS.TYPE_MESSAGE}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onPaste={handlePaste}
            onBlur={handleBlur}
            disabled={isInputDisabled}
            rows={1}
            aria-label={CHAT_LABELS.TYPE_MESSAGE}
          />

          <button
            type="button"
            className="chat-emoji-toggle-btn"
            onClick={() => setShowEmojiPicker((v) => !v)}
            disabled={isInputDisabled}
            aria-label="Chọn emoji"
            title="Biểu tượng cảm xúc"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>
        </div>

        {/* Toolbar Right */}
        <div className="chat-composer-right">
          <button
            type="button"
            className={`chat-send-btn ${text.trim().length > 0 ? 'chat-send-btn--active' : ''}`}
            onClick={handleSend}
            disabled={isInputDisabled || text.trim().length === 0}
            aria-label={CHAT_LABELS.SEND}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
