import { memo, useState } from 'react';

import { useChatContext } from '@/application/chat';
import { Icon } from '@/shared/components/Icon';

interface ChatContextBarProps {
  entityType: string;
  entityId: string;
}

export const ChatContextBar = memo(function ChatContextBar({
  entityType,
  entityId,
}: ChatContextBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: context } = useChatContext(entityType, entityId);

  if (!context) return null;

  const handleCopyPhone = () => {
    if (context.phone) {
      void navigator.clipboard.writeText(context.phone);
    }
  };

  return (
    <div className="chat-context-bar-wrapper">
      <div className="chat-context-bar">
        <div className="chat-context-bar-info">
          <span className="chat-context-badge">{context.statusLabel}</span>
          <span className="chat-context-subtitle">{context.subtitle}</span>
        </div>

        <div className="chat-context-bar-actions">
          {context.phone && (
            <a
              href={`tel:${context.phone}`}
              className="chat-context-action-btn"
              title={`Gọi điện (${context.phone})`}
              onClick={handleCopyPhone}
            >
              <Icon name="Phone" size={14} />
              <span>{context.phone}</span>
            </a>
          )}

          {context.detailUrl && (
            <a
              href={context.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-context-action-btn"
              title="Xem trang chi tiết ERP"
            >
              <Icon name="ExternalLink" size={14} />
              <span>Chi tiết</span>
            </a>
          )}

          <button
            type="button"
            className="chat-context-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label="Mở rộng thông tin"
          >
            <Icon
              name="ChevronDown"
              size={14}
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        </div>
      </div>

      {/* Expanded Quick Insights Bar */}
      {isExpanded && (
        <div className="chat-context-expanded-panel">
          <div className="chat-context-metric-item">
            <span className="chat-context-metric-label">Đối tượng:</span>
            <span className="chat-context-metric-value">{context.name}</span>
          </div>
          <div className="chat-context-metric-item">
            <span className="chat-context-metric-label">Mã hệ thống:</span>
            <span className="chat-context-metric-value">{context.code}</span>
          </div>
        </div>
      )}
    </div>
  );
});
