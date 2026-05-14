import { Icon } from '@/shared/components';

import { RECURRING_LABELS } from './recurring-transactions.constants';

type GenerateFeedbackProps = {
  message: string | null;
};

/**
 * Presentational component for showing generate-expense feedback inline.
 * Renders nothing when message is null.
 */
export function GenerateFeedback({ message }: GenerateFeedbackProps) {
  if (!message) return null;

  const isError = message.includes(RECURRING_LABELS.errorPrefix);

  return (
    <div className="px-5 pb-4">
      <div
        className={`p-3 rounded-md text-sm ${
          isError
            ? 'bg-[var(--danger-surface)] text-[var(--danger-strong)]'
            : 'bg-[var(--success-surface)] text-[var(--success-strong)]'
        }`}
      >
        <Icon
          name={isError ? 'AlertCircle' : 'CheckCircle2'}
          size={16}
          className="inline mr-2"
        />
        {message}
      </div>
    </div>
  );
}
