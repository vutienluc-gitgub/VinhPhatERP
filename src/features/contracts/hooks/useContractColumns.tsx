import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { ActionBar } from '@/shared/components';
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_MESSAGES as MSG,
} from '@/features/contracts/contracts.module';
import type { Contract } from '@/features/contracts/contracts.module';
import { StatusBadge } from '@/shared/components';
import { formatContractDate } from '@/features/contracts/contracts.utils';

type UseContractColumnsProps = {
  onView?: (contract: Contract) => void;
};

export function useContractColumns({
  onView,
}: UseContractColumnsProps): ColumnDef<Contract>[] {
  return useMemo<ColumnDef<Contract>[]>(
    () => [
      {
        accessorKey: 'contract_number',
        header: MSG.COL_CONTRACT_NUMBER,
        cell: ({ row }) => (
          <span className="font-bold text-primary font-mono text-sm">
            {row.original.contract_number}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: MSG.COL_TYPE,
        cell: ({ row }) => (
          <span className="badge-outline text-xs">
            {CONTRACT_TYPE_LABELS[row.original.type]}
          </span>
        ),
      },
      {
        id: 'party_a',
        header: MSG.COL_PARTY_A,
        cell: ({ row }) => {
          const contract = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{contract.party_a_name}</span>
              {contract.party_a_tax_code && (
                <span className="text-xs text-muted">
                  {MSG.TAX_CODE_LABEL}
                  {contract.party_a_tax_code}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: MSG.COL_STATUS,
        cell: ({ row }) => (
          <StatusBadge domain="CONTRACT" status={row.original.status} />
        ),
      },
      {
        accessorKey: 'created_at',
        header: MSG.COL_CREATED_AT,
        meta: { className: 'text-muted text-sm' },
        cell: ({ row }) => formatContractDate(row.original.created_at),
      },
      {
        id: 'actions',
        header: MSG.COL_ACTIONS,
        meta: { className: 'text-right' },
        cell: ({ row }) => (
          <ActionBar
            actions={[
              {
                icon: 'Eye',
                onClick: () => onView?.(row.original),
                title: MSG.ACTION_VIEW_DETAILS,
              },
            ]}
          />
        ),
      },
    ],
    [onView],
  );
}
