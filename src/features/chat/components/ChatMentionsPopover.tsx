import { memo } from 'react';

import { Icon } from '@/shared/components/Icon';
import type { MentionOption } from '@/application/chat';

interface Props {
  options: MentionOption[];
  selectedIndex: number;
  onSelectOption: (option: MentionOption) => void;
}

function getSubtext(type: MentionOption['type']): string {
  if (type === 'role') return 'Bộ phận / Nhóm';
  if (type === 'document') return 'Chứng từ / Hồ sơ';
  return 'Thành viên';
}

function getIconName(
  type: MentionOption['type'],
): 'Users' | 'FileText' | 'User' {
  if (type === 'role') return 'Users';
  if (type === 'document') return 'FileText';
  return 'User';
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
          <div
            className={`chat-mention-type-icon chat-mention-type-icon--${opt.type}`}
          >
            <Icon name={getIconName(opt.type)} size={15} />
          </div>
          <div className="chat-mention-content">
            <span className="chat-mention-label">{opt.label}</span>
            <span className="chat-mention-subtext">{getSubtext(opt.type)}</span>
          </div>
        </button>
      ))}
    </div>
  );
});
