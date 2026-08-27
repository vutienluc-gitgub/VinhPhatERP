import { memo } from 'react';

import { CHAT_LABELS } from '@/schema/chat.schema';
import type { MentionOption } from '@/application/chat';

interface Props {
  options: MentionOption[];
  selectedIndex: number;
  onSelectOption: (option: MentionOption) => void;
}

export const ChatMentionsPopover = memo(function ChatMentionsPopover({
  options,
  selectedIndex,
  onSelectOption,
}: Props) {
  if (options.length === 0) return null;

  return (
    <div
      className="chat-mentions-popover"
      role="listbox"
      aria-label="Danh sách gợi ý nhắc tên"
    >
      {options.map((opt, idx) => (
        <button
          key={`${opt.type}-${opt.id}`}
          type="button"
          role="option"
          aria-selected={idx === selectedIndex}
          className={`chat-mention-option ${idx === selectedIndex ? 'chat-mention-option--active' : ''}`}
          onClick={() => onSelectOption(opt)}
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
  );
});
