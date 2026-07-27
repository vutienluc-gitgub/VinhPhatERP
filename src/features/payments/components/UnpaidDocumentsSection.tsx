import { useWatch } from 'react-hook-form';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { MoneyText } from '@/shared/value';
import { sumBy } from '@/shared/utils/array.util';
import type { ExpenseFormValues } from '@/features/payments/payments.module';
import { useGroupedUnpaidDocuments } from '@/features/payments/hooks/useGroupedUnpaidDocuments';
import { UNPAID_DOCS_MESSAGES as MSG } from '@/features/payments/payments.constants';

/** Type cho 1 allocation item trong form */
type AllocationItem = ExpenseFormValues['allocations'][number];

type UnpaidDocumentsSectionProps = {
  supplierId: string;
  control: Control<ExpenseFormValues>;
  setValue: UseFormSetValue<ExpenseFormValues>;
};

export function UnpaidDocumentsSection({
  supplierId,
  control,
  setValue,
}: UnpaidDocumentsSectionProps) {
  const { groupedDocs, isLoading, unpaidDocs } =
    useGroupedUnpaidDocuments(supplierId);

  const allocations =
    useWatch({
      control,
      name: 'allocations',
    }) || [];

  if (!supplierId || isLoading || !unpaidDocs?.length) return null;

  return (
    <div className="form-field col-span-full mt-4">
      <label className="text-sm font-semibold mb-2 block">
        {MSG.DEDUCT_DEBT}
      </label>
      <div className="bg-[var(--surface-sunken)] p-3 rounded-md border border-[var(--border-subtle)] space-y-2 max-h-64 overflow-y-auto">
        {groupedDocs.map((group) => {
          // Check if all items in this group are selected
          const isSelected = group.items.every((doc) =>
            allocations.some(
              (a: AllocationItem) => a.document_id === doc.document_id,
            ),
          );

          return (
            <div
              key={group.id}
              className="flex items-center gap-3 p-2 bg-[var(--surface-default)] rounded border border-[var(--border-subtle)]"
            >
              <input
                type="checkbox"
                className="w-4 h-4 rounded appearance-none checked:bg-primary border border-muted checked:border-primary shrink-0 relative
                  after:content-['✓'] after:absolute after:text-[10px] after:text-white after:left-[3px] after:top-[1px] after:opacity-0 checked:after:opacity-100 cursor-pointer"
                checked={isSelected}
                onChange={(e) => {
                  const chk = e.target.checked;
                  let currentAlloc = [...allocations];
                  if (chk) {
                    group.items.forEach((doc) => {
                      if (
                        !currentAlloc.some(
                          (a: AllocationItem) =>
                            a.document_id === doc.document_id,
                        )
                      ) {
                        currentAlloc.push({
                          document_type: doc.document_type,
                          document_id: doc.document_id,
                          allocated_amount: doc.remaining_amount,
                        });
                      }
                    });
                  } else {
                    currentAlloc = currentAlloc.filter(
                      (a: AllocationItem) =>
                        !group.items.some(
                          (d) => d.document_id === a.document_id,
                        ),
                    );
                  }

                  setValue('allocations', currentAlloc);
                  // Tự động tính tổng tiền vào ô So Tien
                  const sumAmount = sumBy(
                    currentAlloc,
                    (a: AllocationItem) => a.allocated_amount,
                  );
                  setValue('amount', sumAmount);
                }}
              />
              <div className="flex-1 text-sm">
                <div className="font-medium">{group.title}</div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {group.subtitle}
                  {' - '} {MSG.LBL_DATE}{' '}
                  {new Date(group.date).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-[var(--danger-strong)]">
                  <MoneyText value={group.remaining} />
                </div>
                {group.paid_amount > 0 && (
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {MSG.LBL_PAID} <MoneyText value={group.paid_amount} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
