import { useState } from 'react';

import { useYarnReceipt, useYarnReceiptList } from '@/application/inventory';
import { sumBy } from '@/shared/utils/array.util';

import type { YarnReceipt } from './types';
import { YarnReceiptForm } from './YarnReceiptForm';
import { YarnReceiptList } from './YarnReceiptList';

export function YarnReceiptsPage() {
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: editReceipt } = useYarnReceipt(editId ?? undefined);

  const { data: listResult } = useYarnReceiptList({}, 1);
  const receipts = listResult?.data ?? [];

  const totalWeight = sumBy(
    receipts,
    (r) => sumBy(r.yarn_receipt_items, (it) => Number(it.quantity) || 0) || 0,
  );

  const pendingCount = receipts.filter((r) => r.status === 'draft').length;
  const supplierCount = Array.from(
    new Set(receipts.map((r) => r.supplier_id)),
  ).length;

  function openCreate() {
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(receipt: YarnReceipt) {
    setEditId(receipt.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
  }

  return (
    <div className="page-container">
      <YarnReceiptList
        onEdit={openEdit}
        onNew={openCreate}
        totalWeight={totalWeight}
        pendingCount={pendingCount}
        supplierCount={supplierCount}
      />
      {showForm && (
        <YarnReceiptForm
          receipt={
            editId && editReceipt
              ? (editReceipt as unknown as YarnReceipt)
              : null
          }
          onClose={closeForm}
        />
      )}
    </div>
  );
}
