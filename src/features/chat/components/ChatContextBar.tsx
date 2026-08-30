import { memo, useMemo, useState } from 'react';

import { useChatContext } from '@/application/chat';
import { CHAT_CONTEXT_LABELS } from '@/schema/chat.schema';
import { Icon } from '@/shared/components/Icon';
import { useAuth } from '@/shared/hooks/useAuth';

interface ChatContextBarProps {
  entityType: string;
  entityId: string;
  role?: string | null;
}

export const ChatContextBar = memo(function ChatContextBar({
  entityType,
  entityId,
  role: propRole,
}: ChatContextBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { profile } = useAuth();
  const effectiveRole = propRole ?? profile?.role;
  const { data: context } = useChatContext(entityType, entityId);

  const displayInfo = useMemo(() => {
    if (!context) return null;

    if (effectiveRole === 'customer') {
      return {
        badge: CHAT_CONTEXT_LABELS.CUSTOMER_SUPPORT_BADGE,
        subtitle: CHAT_CONTEXT_LABELS.COMPANY_NAME,
        phone: CHAT_CONTEXT_LABELS.COMPANY_HOTLINE,
        detailUrl: undefined,
        expandedLabel: CHAT_CONTEXT_LABELS.CHANNEL_LABEL,
        expandedValue: CHAT_CONTEXT_LABELS.CHANNEL_VALUE_CUSTOMER,
        expandedCodeLabel: undefined,
        expandedCodeValue: undefined,
      };
    }

    if (effectiveRole === 'driver') {
      return {
        badge: CHAT_CONTEXT_LABELS.DRIVER_SUPPORT_BADGE,
        subtitle: CHAT_CONTEXT_LABELS.COMPANY_NAME,
        phone: CHAT_CONTEXT_LABELS.COMPANY_HOTLINE,
        detailUrl: undefined,
        expandedLabel: CHAT_CONTEXT_LABELS.CHANNEL_LABEL,
        expandedValue: CHAT_CONTEXT_LABELS.CHANNEL_VALUE_DRIVER,
        expandedCodeLabel: undefined,
        expandedCodeValue: undefined,
      };
    }

    if (effectiveRole === 'supplier') {
      return {
        badge: CHAT_CONTEXT_LABELS.SUPPLIER_SUPPORT_BADGE,
        subtitle: CHAT_CONTEXT_LABELS.COMPANY_NAME,
        phone: CHAT_CONTEXT_LABELS.COMPANY_HOTLINE,
        detailUrl: undefined,
        expandedLabel: CHAT_CONTEXT_LABELS.CHANNEL_LABEL,
        expandedValue: CHAT_CONTEXT_LABELS.CHANNEL_VALUE_SUPPLIER,
        expandedCodeLabel: undefined,
        expandedCodeValue: undefined,
      };
    }

    // Default internal staff perspective
    return {
      badge: context.statusLabel,
      subtitle: context.subtitle,
      phone: context.phone,
      detailUrl: context.detailUrl,
      expandedLabel: CHAT_CONTEXT_LABELS.TARGET_LABEL,
      expandedValue: context.name,
      expandedCodeLabel: CHAT_CONTEXT_LABELS.SYSTEM_CODE_LABEL,
      expandedCodeValue: context.code,
    };
  }, [context, effectiveRole]);

  if (!context || !displayInfo) return null;

  const handleCopyPhone = () => {
    if (displayInfo.phone) {
      void navigator.clipboard.writeText(displayInfo.phone);
    }
  };

  return (
    <div className="chat-context-bar-wrapper">
      <div className="chat-context-bar">
        <div className="chat-context-bar-info">
          <span className="chat-context-badge">{displayInfo.badge}</span>
          <span className="chat-context-subtitle">{displayInfo.subtitle}</span>
        </div>

        <div className="chat-context-bar-actions">
          {displayInfo.phone && (
            <a
              href={`tel:${displayInfo.phone}`}
              className="chat-context-action-btn"
              title={`Gọi điện (${displayInfo.phone})`}
              onClick={handleCopyPhone}
            >
              <Icon name="Phone" size={14} />
              <span>{displayInfo.phone}</span>
            </a>
          )}

          {displayInfo.detailUrl && (
            <a
              href={displayInfo.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-context-action-btn"
              title="Xem trang chi tiết ERP"
            >
              <Icon name="ExternalLink" size={14} />
              <span>{CHAT_CONTEXT_LABELS.VIEW_DETAIL}</span>
            </a>
          )}

          <button
            type="button"
            className="chat-context-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={CHAT_CONTEXT_LABELS.EXPAND_INFO}
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
            <span className="chat-context-metric-label">
              {displayInfo.expandedLabel}
            </span>
            <span className="chat-context-metric-value">
              {displayInfo.expandedValue}
            </span>
          </div>
          {displayInfo.expandedCodeLabel && displayInfo.expandedCodeValue && (
            <div className="chat-context-metric-item">
              <span className="chat-context-metric-label">
                {displayInfo.expandedCodeLabel}
              </span>
              <span className="chat-context-metric-value">
                {displayInfo.expandedCodeValue}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
