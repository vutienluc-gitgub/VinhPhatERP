import { Icon } from '@/shared/components';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_MESSAGES as MSG,
} from '@/features/contracts/contracts.module';
import type { Contract } from '@/features/contracts/contracts.module';
import { ContractStatusBadge } from '@/features/contracts/ContractStatusBadge';
import { formatContractDate } from '@/features/contracts/contracts.utils';

type ContractMobileCardProps = {
  contract: Contract;
};

export function ContractMobileCard({ contract }: ContractMobileCardProps) {
  return (
    <div className="mobile-card">
      <div className="mobile-card-header">
        <span className="mobile-card-title font-mono text-sm">
          {contract.contract_number}
        </span>
        <ContractStatusBadge status={contract.status} />
      </div>
      <div className="mobile-card-body space-y-2">
        <p className="font-bold text-base">{contract.party_a_name}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted">
            <Icon name="FileText" size={14} />
            <span>{CONTRACT_TYPE_LABELS[contract.type]}</span>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <Icon name="Calendar" size={14} />
            <span>{formatContractDate(contract.created_at)}</span>
          </div>
        </div>

        {contract.party_a_tax_code && (
          <p className="text-xs text-muted">
            {MSG.TAX_CODE_LABEL}
            {contract.party_a_tax_code}
          </p>
        )}

        <div className="flex justify-end items-center pt-2 mt-2 border-t border-border/10">
          <Icon name="ChevronRight" size={16} className="text-muted" />
        </div>
      </div>
    </div>
  );
}
