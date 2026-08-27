import { forwardRef } from 'react';

// eslint-disable-next-line no-restricted-syntax -- Allowed emoji dataset for chat picker
const PICKER_EMOJIS = [
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
] as const;

interface Props {
  onSelectEmoji: (emoji: string) => void;
}

export const ChatEmojiPicker = forwardRef<HTMLDivElement, Props>(
  function ChatEmojiPicker({ onSelectEmoji }, ref) {
    return (
      <div
        ref={ref}
        className="chat-emoji-picker"
        role="dialog"
        aria-label="Bảng biểu tượng cảm xúc"
      >
        <div className="chat-emoji-grid">
          {PICKER_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="chat-emoji-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  },
);

ChatEmojiPicker.displayName = 'ChatEmojiPicker';
