import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

import {
  CHAT_LABELS,
  type ChatMessage,
  type ChatMention,
} from '@/schema/chat.schema';
import { uploadChatImage, uploadChatFile } from '@/shared/lib/chat-storage';
import { chatAudio } from '@/shared/lib/chat-audio';
import { useMentionsSearch, type MentionOption } from '@/application/chat';
import { Icon } from '@/shared/components/Icon';

import { ChatQuickReplies } from './ChatQuickReplies';

interface ChatInputAreaProps {
  onSend: (content: string, mentions?: ChatMention[]) => void;
  onSendImage?: (imageUrl: string) => void;
  onSendFile?: (fileUrl: string, fileName: string, fileType: string) => void;
  roomId?: string;
  disabled?: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  replyingToMessage?: ChatMessage | null;
  onCancelReply?: () => void;
}

export function ChatInputArea({
  onSend,
  onSendImage,
  onSendFile,
  roomId,
  disabled,
  onTypingStart,
  onTypingStop,
  replyingToMessage,
  onCancelReply,
}: ChatInputAreaProps) {
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState<ChatMention[]>([]);
  const [activeMention, setActiveMention] = useState<{
    type: 'user' | 'document';
    query: string;
    startIndex: number;
  } | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
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
  const emojiToggleBtnRef = useRef<HTMLButtonElement>(null);

  const { data: mentionOptions = [] } = useMentionsSearch(
    activeMention?.type ?? null,
    activeMention?.query ?? '',
  );

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojiPicker) return undefined;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        emojiToggleBtnRef.current &&
        !emojiToggleBtnRef.current.contains(target)
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

      // Restore cursor position after emoji without closing picker
      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = start + emoji.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [text],
  );

  const handleSend = useCallback(() => {
    let trimmed = text.trim();
    if (!trimmed || disabled || isUploading) return;

    if (replyingToMessage) {
      const snippet = replyingToMessage.content
        ? replyingToMessage.content.slice(0, 40)
        : replyingToMessage.message_type;
      trimmed = `↩️ "${snippet}"\n${trimmed}`;
    }

    // Filter mentions that actually exist in the text
    const validMentions = mentions.filter((m) => trimmed.includes(m.label));

    onSend(trimmed, validMentions.length > 0 ? validMentions : undefined);
    chatAudio.playSentSound();
    setText('');
    setMentions([]);
    setActiveMention(null);
    setShowEmojiPicker(false);
    onCancelReply?.();
    onTypingStop?.();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [
    text,
    disabled,
    isUploading,
    replyingToMessage,
    mentions,
    onSend,
    onCancelReply,
    onTypingStop,
  ]);

  const handleQuickReply = useCallback(
    (replyText: string) => {
      onSend(replyText);
      chatAudio.playSentSound();
    },
    [onSend],
  );

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

  const handleSelectMention = useCallback(
    (option: MentionOption) => {
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
    },
    [activeMention, text],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (activeMention && mentionOptions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedMentionIndex((prev) => (prev + 1) % mentionOptions.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedMentionIndex(
            (prev) =>
              (prev - 1 + mentionOptions.length) % mentionOptions.length,
          );
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const selectedOption = mentionOptions[selectedMentionIndex];
          if (selectedOption) {
            handleSelectMention(selectedOption);
          }
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [
      activeMention,
      mentionOptions,
      selectedMentionIndex,
      handleSelectMention,
      handleSend,
    ],
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
      {/* Quoted Reply Banner */}
      {replyingToMessage && (
        <div className="chat-reply-banner">
          <div className="chat-reply-banner-content">
            <div className="chat-reply-banner-header">
              <Icon name="CornerUpLeft" size={12} />
              <span>Đang trả lời tin nhắn:</span>
            </div>
            <p className="chat-reply-banner-text">
              {replyingToMessage.content || replyingToMessage.message_type}
            </p>
          </div>
          <button
            type="button"
            className="chat-reply-banner-close"
            onClick={onCancelReply}
            aria-label="Hủy trả lời"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

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
              <Icon name="X" size={12} />
            </button>
          )}
        </div>
      )}

      {/* File Preview */}
      {previewFile && (
        <div className="chat-file-preview">
          <div className="chat-file-preview-icon">
            <Icon name="FileText" size={24} />
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
              <Icon name="X" size={12} />
            </button>
          )}
        </div>
      )}

      {/* Mentions Popover */}
      {activeMention && mentionOptions.length > 0 && (
        <div className="chat-mentions-popover">
          {mentionOptions.map((opt, idx) => (
            <button
              key={`${opt.type}-${opt.id}`}
              className={`chat-mention-option ${idx === selectedMentionIndex ? 'chat-mention-option--active' : ''}`}
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Canned Replies */}
      <ChatQuickReplies
        onSelectReply={handleQuickReply}
        disabled={isInputDisabled}
      />

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
                <Icon name="Paperclip" size={18} />
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
            ref={emojiToggleBtnRef}
            type="button"
            className="chat-emoji-toggle-btn"
            onClick={() => setShowEmojiPicker((v) => !v)}
            disabled={isInputDisabled}
            aria-label="Chọn emoji"
            title="Biểu tượng cảm xúc"
          >
            <Icon name="Smile" size={18} />
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
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
