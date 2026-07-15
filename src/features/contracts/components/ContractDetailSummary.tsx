import { CONTRACT_LABELS } from '@/features/contracts/contracts.constants';
import type { Contract } from '@/features/contracts/contracts.module';
import { formatContractDate } from '@/features/contracts/contracts.utils';

export function ContractDetailSummary({ contract }: { contract: Contract }) {
  return (
    <div className="dashboard-summary-row mb-4">
      <div>
        <div className="text-muted text-sm summary-label">
          {CONTRACT_LABELS.PARTY_A}
        </div>
        <div className="font-medium">{contract.party_a_name}</div>
        {contract.party_a_tax_code && (
          <div className="text-xs text-muted">
            {CONTRACT_LABELS.TAX_CODE}: {contract.party_a_tax_code}
          </div>
        )}
      </div>
      <div>
        <div className="text-muted text-sm summary-label">
          {CONTRACT_LABELS.REP_A}
        </div>
        <div>{contract.party_a_representative ?? '—'}</div>
        {contract.party_a_title && (
          <div className="text-xs text-muted">{contract.party_a_title}</div>
        )}
      </div>
      <div>
        <div className="text-muted text-sm summary-label">
          {CONTRACT_LABELS.EFFECTIVE_DATE}
        </div>
        <div>{formatContractDate(contract.effective_date)}</div>
      </div>
      <div>
        <div className="text-muted text-sm summary-label">
          {CONTRACT_LABELS.EXPIRY_DATE}
        </div>
        <div>{formatContractDate(contract.expiry_date)}</div>
      </div>
      <div>
        <div className="text-muted text-sm summary-label">
          {CONTRACT_LABELS.PAYMENT_TERM}
        </div>
        <div>{contract.payment_term ?? '—'}</div>
      </div>
    </div>
  );
}
