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
import { ChatEmojiPicker } from './ChatEmojiPicker';
import { ChatUploadPreview } from './ChatUploadPreview';
import { ChatMentionsPopover } from './ChatMentionsPopover';
import { ChatUtilityMenu, type ChatUtilityType } from './ChatUtilityMenu';

export interface ChatSendMeta {
  mentions?: ChatMention[];
  replyToId?: string | null;
  replyToMessage?: ChatMessage | null;
}

interface ChatInputAreaProps {
  onSend: (content: string, meta?: ChatSendMeta) => void;
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
  const [debouncedQuery, setDebouncedQuery] = useState('');
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
  const [showUtilityMenu, setShowUtilityMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiToggleBtnRef = useRef<HTMLButtonElement>(null);
  const utilityMenuRef = useRef<HTMLDivElement>(null);
  const utilityToggleBtnRef = useRef<HTMLButtonElement>(null);

  // Debounce mention query to avoid flooding database with queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(activeMention?.query ?? '');
    }, 300);
    return () => clearTimeout(timer);
  }, [activeMention?.query]);

  // Reset selected mention index when query or active type changes
  useEffect(() => {
    setSelectedMentionIndex(0);
  }, [debouncedQuery, activeMention?.type]);

  const { data: mentionOptions = [] } = useMentionsSearch(
    activeMention?.type ?? null,
    debouncedQuery,
  );

  // Clean up objectUrl on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Close emoji picker and utility menu when clicking outside
  useEffect(() => {
    if (!showEmojiPicker && !showUtilityMenu) return undefined;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        emojiToggleBtnRef.current &&
        !emojiToggleBtnRef.current.contains(target)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        showUtilityMenu &&
        utilityMenuRef.current &&
        !utilityMenuRef.current.contains(target) &&
        utilityToggleBtnRef.current &&
        !utilityToggleBtnRef.current.contains(target)
      ) {
        setShowUtilityMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showUtilityMenu]);

  const handleSelectUtility = useCallback((type: ChatUtilityType) => {
    let prefix = '#';
    if (type === 'shipment') prefix = '#GH-';
    if (type === 'quotation') prefix = '#BG-';
    if (type === 'order') prefix = '#DH-';

    setText((prev) => {
      const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
      return `${prev}${space}${prefix}`;
    });

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 50);
  }, []);

  // Auto-focus textarea on desktop devices on mount for instant T5 interactivity
  useEffect(() => {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isMobile && textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Focus textarea when quoting/replying to a message
  useEffect(() => {
    if (replyingToMessage && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingToMessage]);

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

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
    const trimmed = text.trim();
    if (!trimmed || disabled || isUploading) return;

    const validMentions = mentions.filter((m) => trimmed.includes(m.label));
    const meta: ChatSendMeta = {};
    if (validMentions.length > 0) meta.mentions = validMentions;
    if (replyingToMessage) {
      meta.replyToId = replyingToMessage.id;
      meta.replyToMessage = replyingToMessage;
    }

    onSend(trimmed, Object.keys(meta).length > 0 ? meta : undefined);
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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

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

      if (e.key === 'Escape') {
        if (replyingToMessage) {
          e.preventDefault();
          onCancelReply?.();
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
      replyingToMessage,
      onCancelReply,
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (val.length > 0) {
      onTypingStart?.(); // Notify immediately
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStop?.(); // Idle after 2 seconds
      }, 2000);
    } else {
      onTypingStop?.();
    }

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

        if (file.type.startsWith('image/')) {
          setPreviewUrl(objectUrl);
          const result = await uploadChatImage(file, roomId);
          if (onSendImage) {
            onSendImage(result.publicUrl);
          }
        } else {
          setPreviewFile({ url: objectUrl, name: file.name, type: file.type });
          const result = await uploadChatFile(file, roomId);
          if (onSendFile) {
            onSendFile(result.publicUrl, result.fileName, result.fileType);
          }
        }
        clearPreview();
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        const message =
          err instanceof Error ? err.message : CHAT_LABELS.SEND_ERROR;
        setUploadError(message);
      } finally {
        setIsUploading(false);
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        void processFile(file);
      }
    },
    [processFile],
  );

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const isInputDisabled = disabled || isUploading;

  return (
    <div
      className={`chat-input-area-wrapper${isDragOver ? ' chat-input-area-wrapper--dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Quoted Reply Banner */}
      {replyingToMessage && (
        <div className="chat-reply-banner">
          <div className="chat-reply-banner-content">
            <div className="chat-reply-banner-header">
              <Icon name="CornerUpLeft" size={12} />
              <span>{CHAT_LABELS.REPLYING_TO}</span>
            </div>
            <p className="chat-reply-banner-text">
              {replyingToMessage.content || replyingToMessage.message_type}
            </p>
          </div>
          <button
            type="button"
            className="chat-reply-banner-close"
            onClick={onCancelReply}
            aria-label={CHAT_LABELS.CANCEL_REPLY}
          >
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {/* Attachment Previews */}
      <ChatUploadPreview
        previewUrl={previewUrl}
        previewFile={previewFile}
        isUploading={isUploading}
        onClear={clearPreview}
      />

      {/* Upload Error */}
      {uploadError && <div className="chat-upload-error">{uploadError}</div>}

      {/* Quick Canned Replies */}
      <ChatQuickReplies
        onSelectReply={handleQuickReply}
        disabled={isInputDisabled}
      />

      {/* Input Row — Toolbar Architecture */}
      <div className="chat-composer">
        {/* Mentions Popover anchored directly to composer */}
        {activeMention && mentionOptions.length > 0 && (
          <ChatMentionsPopover
            options={mentionOptions}
            selectedIndex={selectedMentionIndex}
            onSelectOption={handleSelectMention}
          />
        )}

        {/* Emoji Picker Popover anchored directly to composer */}
        {showEmojiPicker && (
          <ChatEmojiPicker ref={emojiPickerRef} onSelectEmoji={insertEmoji} />
        )}

        {/* ERP Utility Menu Popover */}
        {showUtilityMenu && (
          <ChatUtilityMenu
            ref={utilityMenuRef}
            onSelectUtility={handleSelectUtility}
            onClose={() => setShowUtilityMenu(false)}
          />
        )}

        {/* Toolbar Left: Emoji */}
        <div className="chat-composer-left">
          <button
            ref={emojiToggleBtnRef}
            type="button"
            className="chat-attach-btn"
            onClick={() => setShowEmojiPicker((v) => !v)}
            disabled={isInputDisabled}
            aria-label={CHAT_LABELS.CHOOSE_EMOJI}
            title={CHAT_LABELS.EMOJI_TOOLTIP}
          >
            <Icon name="Smile" size={20} />
          </button>
        </div>

        {/* Composer Central Box (Auto-grow Textarea) */}
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
        </div>

        {/* Toolbar Right: Quick Image, ERP Utility Menu, Send */}
        <div className="chat-composer-right flex items-center gap-1">
          {onSendImage && roomId && (
            <>
              <button
                type="button"
                className="chat-composer-btn"
                onClick={handleAttachClick}
                disabled={isInputDisabled}
                aria-label={CHAT_LABELS.ATTACH_IMAGE_QUICK}
                title={CHAT_LABELS.UPLOAD_ATTACHMENT_TOOLTIP}
              >
                <Icon name="Image" size={19} />
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

          {/* ERP Utility Menu (•••) */}
          <button
            ref={utilityToggleBtnRef}
            type="button"
            className={`chat-composer-btn${showUtilityMenu ? ' chat-composer-btn--active' : ''}`}
            onClick={() => setShowUtilityMenu((v) => !v)}
            disabled={isInputDisabled}
            aria-label={CHAT_LABELS.UTILITIES_MENU}
            title={CHAT_LABELS.UTILITIES_MENU}
          >
            <Icon name="MoreHorizontal" size={19} />
          </button>

          {/* Send Button */}
          {text.trim().length > 0 && (
            <button
              type="button"
              className="chat-send-btn chat-send-btn--active"
              onClick={handleSend}
              disabled={isInputDisabled}
              aria-label={CHAT_LABELS.SEND}
              title={CHAT_LABELS.SEND}
            >
              <Icon name="Send" size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
