import { memo, useEffect } from 'react';

import { CANNED_RESPONSES } from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';
import { customerPortalAudit } from '@/features/customer-portal/audit/customerQueryAuditLogger';

interface Props {
  onSelectReply: (reply: string) => void;
  disabled?: boolean;
}

export const ChatQuickReplies = memo(function ChatQuickReplies({
  onSelectReply,
  disabled,
}: Props) {
  useEffect(() => {
    const isPortal = typeof window !== 'undefined' && window.location.pathname.startsWith('/portal');
    const tracker = customerPortalAudit.startQuery('customer-portal-quick-replies', {
      caller: 'ChatQuickReplies',
      isPortal,
      availableCount: CANNED_RESPONSES.length,
    });

    tracker.logCacheLookup(['canned_responses'], true, CANNED_RESPONSES);
    tracker.logTransform(
      CANNED_RESPONSES,
      CANNED_RESPONSES,
      { contextType: isPortal ? 'customer_portal' : 'internal_crm' }
    );
    tracker.logComplete(CANNED_RESPONSES);
  }, []);

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
        {CANNED_RESPONSES.map((reply) => (
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

