import { useState } from 'react';

import { useWeavingInvoice } from '@/application/production';

import type { WeavingInvoice } from './types';
import { WeavingInvoiceForm } from './WeavingInvoiceForm';
import { WeavingInvoiceList } from './WeavingInvoiceList';

function WeavingInvoiceFormWrapper({
  invoiceId,
  onClose,
}: {
  invoiceId?: string | null;
  onClose: () => void;
}) {
  const { data: fullInvoice, isPending } = useWeavingInvoice(
    invoiceId || undefined,
  );

  if (invoiceId && isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-700">
            Đang tải dữ liệu phiếu...
          </span>
        </div>
      </div>
    );
  }

  return (
    <WeavingInvoiceForm
      invoice={invoiceId ? fullInvoice || null : null}
      onClose={onClose}
    />
  );
}

export function WeavingInvoicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);

  function openCreate() {
    setEditInvoiceId(null);
    setShowForm(true);
  }

  function openEdit(inv: WeavingInvoice) {
    setEditInvoiceId(inv.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditInvoiceId(null);
  }

  return (
    <div className="page-container">
      <WeavingInvoiceList onNew={openCreate} onEdit={openEdit} />
      {showForm && (
        <WeavingInvoiceFormWrapper
          invoiceId={editInvoiceId}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
