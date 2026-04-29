import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

import { CHAT_LABELS } from '@/schema/chat.schema';
import { uploadChatImage } from '@/shared/lib/chat-storage';

interface ChatInputAreaProps {
  onSend: (content: string) => void;
  onSendImage?: (imageUrl: string) => void;
  roomId?: string;
  disabled?: boolean;
}

export function ChatInputArea({
  onSend,
  onSendImage,
  roomId,
  disabled,
}: ChatInputAreaProps) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isUploading) return;

    onSend(trimmed);
    setText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, isUploading, onSend]);

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

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!roomId || !onSendImage) return;

      setUploadError(null);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      setIsUploading(true);
      try {
        const result = await uploadChatImage(file, roomId);
        onSendImage(result.publicUrl);
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
    [roomId, onSendImage, clearPreview],
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

      {/* Upload Error */}
      {uploadError && <div className="chat-upload-error">{uploadError}</div>}

      {/* Input Row */}
      <div className="chat-input-area">
        {/* Attach Button */}
        {onSendImage && roomId && (
          <>
            <button
              type="button"
              className="chat-attach-btn"
              onClick={handleAttachClick}
              disabled={isInputDisabled}
              aria-label={CHAT_LABELS.ATTACH_IMAGE}
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
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleFileSelect(e)}
              className="chat-file-input-hidden"
              aria-hidden="true"
              tabIndex={-1}
            />
          </>
        )}

        <textarea
          ref={textareaRef}
          className="chat-input-field"
          placeholder={CHAT_LABELS.TYPE_MESSAGE}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onPaste={handlePaste}
          disabled={isInputDisabled}
          rows={1}
          aria-label={CHAT_LABELS.TYPE_MESSAGE}
        />
        <button
          type="button"
          className="chat-send-btn"
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
  );
}
