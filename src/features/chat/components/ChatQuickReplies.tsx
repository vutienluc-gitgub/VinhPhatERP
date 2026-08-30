import { memo, useMemo } from 'react';

import { getQuickRepliesByRole } from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';
import { useAuth } from '@/shared/hooks/useAuth';

interface Props {
  onSelectReply: (reply: string) => void;
  disabled?: boolean;
  role?: string | null;
}

export const ChatQuickReplies = memo(function ChatQuickReplies({
  onSelectReply,
  disabled,
  role: propRole,
}: Props) {
  const { profile } = useAuth();
  const effectiveRole = propRole ?? profile?.role;

  const quickReplies = useMemo(
    () => getQuickRepliesByRole(effectiveRole),
    [effectiveRole],
  );

  return (
    <div
      className="chat-quick-replies"
      role="region"
      aria-label="Tin nhắn mẫu nhanh"
    >
      <div className="chat-quick-replies-scroll">
        <span className="chat-quick-replies-tag">
          <Icon name="Zap" size={11} />
          <span>Gợi ý:</span>
        </span>
        {quickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            className="chat-quick-reply-pill"
            onClick={() => onSelectReply(reply)}
            disabled={disabled}
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
});
