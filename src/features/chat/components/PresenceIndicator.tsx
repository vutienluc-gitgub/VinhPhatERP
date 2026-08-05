import type { FC } from 'react';

import type { MessagePresence } from '@/features/chat/chat.types';

interface PresenceIndicatorProps {
  presence: MessagePresence;
  showText?: boolean;
  subtext?: string;
}

export const PresenceIndicator: FC<PresenceIndicatorProps> = ({
  presence,
  showText = true,
  subtext,
}) => {
  const getStatusConfig = () => {
    switch (presence) {
      case 'online':
        return {
          color: 'var(--color-success, #22c55e)',
          label: 'Đang hoạt động',
        };
      case 'typing':
        return { color: 'var(--color-info, #0ea5e9)', label: 'Đang nhập...' };
      case 'away':
        return { color: 'var(--color-warning, #f59e0b)', label: 'Vắng mặt' };
      case 'error':
        return { color: 'var(--color-danger, #ef4444)', label: 'Lỗi kết nối' };
      case 'offline':
      default:
        return { color: 'var(--text-muted, #94a3b8)', label: 'Ngoại tuyến' };
    }
  };

  const config = getStatusConfig();
  const displayText = subtext ?? config.label;

  return (
    <div className="chat-presence-indicator">
      <span
        className={`chat-presence-dot chat-presence-dot--${presence}`}
        style={{ backgroundColor: config.color }}
      />
      {showText && <span className="chat-presence-text">{displayText}</span>}
    </div>
  );
};
