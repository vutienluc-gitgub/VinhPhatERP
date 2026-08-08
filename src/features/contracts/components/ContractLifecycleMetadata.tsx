import { CONTRACT_LABELS } from '@/features/contracts/contracts.constants';
import type { Contract } from '@/features/contracts/contracts.module';
import { formatContractDate } from '@/features/contracts/contracts.utils';

export function ContractLifecycleMetadata({
  contract,
}: {
  contract: Contract;
}) {
  if (!contract.sent_at && !contract.signed_at && !contract.cancelled_at) {
    return null;
  }

  return (
    <div className="info-box mb-4 text-sm space-y-1">
      {contract.sent_at && (
        <p>
          <span className="font-medium">{CONTRACT_LABELS.SENT_AT}:</span>{' '}
          {formatContractDate(contract.sent_at)}
        </p>
      )}
      {contract.signed_at && (
        <p>
          <span className="font-medium">{CONTRACT_LABELS.SIGNED_AT}:</span>{' '}
          {formatContractDate(contract.signed_at)}
        </p>
      )}
      {contract.cancelled_at && (
        <p>
          <span className="font-medium">{CONTRACT_LABELS.CANCELLED_AT}:</span>{' '}
          {formatContractDate(contract.cancelled_at)}
          {contract.cancel_reason && (
            <span className="text-muted-foreground">
              {' '}
              — {contract.cancel_reason}
            </span>
          )}
        </p>
      )}
      {contract.signed_file_url && (
        <p>
          <a
            href={contract.signed_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline"
          >
            {CONTRACT_LABELS.VIEW_SIGNED_FILE}
          </a>
        </p>
      )}
    </div>
  );
}
