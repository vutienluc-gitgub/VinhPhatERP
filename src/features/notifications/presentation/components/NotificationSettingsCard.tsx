import React from 'react';

import { Icon } from '@/shared/components';
import { NOTIFICATION_CARD_LABELS } from '@/shared/constants/notifications';
import { useNotificationFacade } from '@/features/notifications/presentation/hooks/useNotificationFacade';
import { NotificationStateBadge } from '@/features/notifications/presentation/components/NotificationStateBadge';

export const NotificationSettingsCard: React.FC = () => {
  const {
    fsmState,
    isLoading,
    isSubscribed,
    isSupported,
    enablePush,
    disablePush,
  } = useNotificationFacade();

  const handleToggle = () => {
    if (isSubscribed) {
      void disablePush();
    } else {
      void enablePush();
    }
  };

  return (
    <div className="p-4 rounded-xl border border-default bg-surface-secondary/40 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-surface border border-default text-foreground shrink-0">
            <Icon name="Smartphone" size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground">
                {NOTIFICATION_CARD_LABELS.PUSH_DEVICE_TITLE}
              </h4>
              <NotificationStateBadge state={fsmState} />
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {NOTIFICATION_CARD_LABELS.PUSH_DEVICE_DESC}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-default flex justify-end">
        {isSupported ? (
          <button
            type="button"
            onClick={handleToggle}
            disabled={isLoading || fsmState === 'DENIED'}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isSubscribed
                ? 'bg-surface border border-default text-danger hover:bg-danger-soft'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : isSubscribed ? (
              <>
                <Icon name="BellOff" size={16} />
                <span>{NOTIFICATION_CARD_LABELS.BTN_DISABLE_PUSH}</span>
              </>
            ) : (
              <>
                <Icon name="BellRing" size={16} />
                <span>{NOTIFICATION_CARD_LABELS.BTN_ENABLE_PUSH}</span>
              </>
            )}
          </button>
        ) : (
          <p className="text-xs text-muted italic">
            Trình duyệt hoặc thiết bị này không hỗ trợ Web Push.
          </p>
        )}
      </div>
    </div>
  );
};
