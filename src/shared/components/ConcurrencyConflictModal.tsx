import { useState } from 'react';

import { CONCURRENCY_UI_LABELS } from '@/shared/constants/concurrency.constants';
import { Icon } from '@/shared/components/Icon';

import { AdaptiveSheet } from './AdaptiveSheet';
import { Button } from './Button';

export type ConcurrencyErrorType =
  | 'CONCURRENCY_CONFLICT'
  | 'INVALID_STATE_TRANSITION'
  | 'RECORD_NOT_FOUND'
  | 'TERMINAL_STATE'
  | 'UNKNOWN';

export interface ConcurrencyConflictModalProps {
  open: boolean;
  onClose: () => void;
  onReload?: () => void | Promise<void>;
  title?: string;
  message?: string;
  errorType?: ConcurrencyErrorType;
}

export function ConcurrencyConflictModal({
  open,
  onClose,
  onReload,
  title,
  message,
  errorType = 'CONCURRENCY_CONFLICT',
}: ConcurrencyConflictModalProps) {
  const [isReloading, setIsReloading] = useState(false);

  const displayTitle =
    title ||
    (errorType === 'CONCURRENCY_CONFLICT'
      ? CONCURRENCY_UI_LABELS.CONFLICT_TITLE
      : errorType === 'INVALID_STATE_TRANSITION'
        ? CONCURRENCY_UI_LABELS.TRANSITION_TITLE
        : errorType === 'TERMINAL_STATE'
          ? CONCURRENCY_UI_LABELS.TERMINAL_TITLE
          : errorType === 'RECORD_NOT_FOUND'
            ? CONCURRENCY_UI_LABELS.NOT_FOUND_TITLE
            : CONCURRENCY_UI_LABELS.CONFLICT_TITLE);

  const displayMessage =
    message ||
    (errorType === 'CONCURRENCY_CONFLICT'
      ? CONCURRENCY_UI_LABELS.CONFLICT_DEFAULT_DESC
      : errorType === 'INVALID_STATE_TRANSITION'
        ? CONCURRENCY_UI_LABELS.TRANSITION_DEFAULT_DESC
        : errorType === 'RECORD_NOT_FOUND'
          ? CONCURRENCY_UI_LABELS.NOT_FOUND_DEFAULT_DESC
          : CONCURRENCY_UI_LABELS.CONFLICT_DEFAULT_DESC);

  const handleReload = async () => {
    if (!onReload) {
      onClose();
      return;
    }
    try {
      setIsReloading(true);
      await onReload();
      onClose();
    } finally {
      setIsReloading(false);
    }
  };

  const renderIcon = () => {
    switch (errorType) {
      case 'CONCURRENCY_CONFLICT':
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Icon name="refresh-cw" className="h-6 w-6" />
          </div>
        );
      case 'INVALID_STATE_TRANSITION':
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Icon name="alert-triangle" className="h-6 w-6" />
          </div>
        );
      case 'TERMINAL_STATE':
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
            <Icon name="ban" className="h-6 w-6" />
          </div>
        );
      case 'RECORD_NOT_FOUND':
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-muted">
            <Icon name="file-question" className="h-6 w-6" />
          </div>
        );
      default:
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Icon name="alert-circle" className="h-6 w-6" />
          </div>
        );
    }
  };

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title={displayTitle}
      size="sm"
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isReloading}
          >
            {CONCURRENCY_UI_LABELS.DISMISS_ACTION}
          </Button>
          {onReload && (
            <Button
              variant="primary"
              type="button"
              onClick={handleReload}
              disabled={isReloading}
              autoFocus
            >
              <Icon
                name="refresh-cw"
                className={`mr-2 h-4 w-4 ${isReloading ? 'animate-spin' : ''}`}
              />
              {isReloading
                ? CONCURRENCY_UI_LABELS.RELOADING_ACTION
                : CONCURRENCY_UI_LABELS.RELOAD_ACTION}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center sm:flex-row sm:text-left">
        <div className="shrink-0">{renderIcon()}</div>
        <div className="flex flex-col gap-1">
          <p className="text-sm leading-relaxed text-foreground">
            {displayMessage}
          </p>
        </div>
      </div>
    </AdaptiveSheet>
  );
}
