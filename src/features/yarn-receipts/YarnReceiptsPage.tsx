import { useState } from 'react';

import { useYarnReceipt, useYarnReceiptList } from '@/application/inventory';

import type { YarnReceipt } from './types';
import { YarnReceiptForm } from './YarnReceiptForm';
import { YarnReceiptList } from './YarnReceiptList';

export function YarnReceiptsPage() {
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: editReceipt } = useYarnReceipt(editId ?? undefined);

  const { data: listResult } = useYarnReceiptList({}, 1);
  const receipts = listResult?.data ?? [];

  const totalWeight = receipts.reduce((acc, r: YarnReceipt) => {
    const itemWeight =
      r.yarn_receipt_items?.reduce(
        (sum: number, it) => sum + (Number(it.quantity) || 0),
        0,
      ) || 0;
    return acc + itemWeight;
  }, 0);

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
    <>
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
    </>
  );
}
