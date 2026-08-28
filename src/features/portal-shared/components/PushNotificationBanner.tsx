import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import {
  usePushSubscription,
  isIOSNonStandalone,
} from '@/shared/hooks/usePushSubscription';
import {
  NOTIFICATION_CARD_LABELS,
  IOS_PWA_LABELS,
} from '@/shared/constants/notifications';

export function PushNotificationBanner() {
  const { isSupported, isSubscribed, permission, isLoading, subscribe } =
    usePushSubscription();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isIOS = isIOSNonStandalone();

  // If already subscribed, blocked, or dismissed in current interaction, don't show
  if (
    (!isSupported && !isIOS) ||
    isSubscribed ||
    permission === 'denied' ||
    dismissed
  ) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleAction = () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    void subscribe();
  };

  return (
    <>
      <aside
        aria-label={NOTIFICATION_CARD_LABELS.ARIA_ENABLE_NOTIFICATION}
        className="relative overflow-hidden bg-gradient-to-r from-primary/15 via-primary/8 to-surface border border-primary/25 rounded-xl p-3.5 sm:p-4 shadow-sm transition-all duration-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ring-1 ring-primary/20">
              <Icon
                name="BellRing"
                size={20}
                className="text-primary animate-pulse"
              />
            </div>
            <div className="min-w-0 pr-6 sm:pr-0">
              <h3 className="text-sm font-semibold text-foreground m-0 flex items-center gap-1.5">
                {NOTIFICATION_CARD_LABELS.BANNER_TITLE}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-medium bg-primary/20 text-primary">
                  {NOTIFICATION_CARD_LABELS.BANNER_RECOMMENDED}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-0 leading-relaxed">
                {NOTIFICATION_CARD_LABELS.BANNER_DESC}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleAction}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  <span>{NOTIFICATION_CARD_LABELS.BTN_ENABLING}</span>
                </>
              ) : (
                <>
                  <Icon name="Bell" size={14} />
                  <span>{NOTIFICATION_CARD_LABELS.BTN_ENABLE_PUSH}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label={NOTIFICATION_CARD_LABELS.ARIA_CLOSE_BANNER}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer border-none bg-transparent absolute top-2 right-2 sm:static"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* In-banner iOS PWA Guidance */}
        {showIOSModal && (
          <div className="mt-3 pt-3 border-t border-primary/20 text-xs text-foreground bg-surface/80 rounded-lg p-3">
            <div className="flex items-center justify-between font-semibold text-primary mb-1.5">
              <span>{IOS_PWA_LABELS.TITLE}</span>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none p-0.5"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
            <p className="text-muted-foreground mb-2 leading-relaxed">
              {IOS_PWA_LABELS.DESC}
            </p>
            <ul className="space-y-1 pl-0 list-none m-0 text-foreground font-medium">
              <li className="flex items-start gap-1.5">
                <Icon
                  name="Share2"
                  size={14}
                  className="text-primary mt-0.5 shrink-0"
                />
                <span>{IOS_PWA_LABELS.STEP_1}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Icon
                  name="PlusSquare"
                  size={14}
                  className="text-primary mt-0.5 shrink-0"
                />
                <span>{IOS_PWA_LABELS.STEP_2}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Icon
                  name="Bell"
                  size={14}
                  className="text-primary mt-0.5 shrink-0"
                />
                <span>{IOS_PWA_LABELS.STEP_3}</span>
              </li>
            </ul>
          </div>
        )}
      </aside>
    </>
  );
}
