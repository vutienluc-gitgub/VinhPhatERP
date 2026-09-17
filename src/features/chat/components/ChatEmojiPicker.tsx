import { forwardRef } from 'react';

/* eslint-disable no-restricted-syntax -- Emoji ở đây là DỮ LIỆU payload gửi lên server
   (bộ chọn emoji của chat), không phải icon trang trí. Thay bằng <Icon /> sẽ làm
   hỏng tính năng chat vì server/client trao đổi đúng codepoint emoji. */
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
/* eslint-enable no-restricted-syntax */

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
