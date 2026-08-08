import { useState } from 'react';

import { useWeavingInvoice } from '@/application/production';
import { PageLayout } from '@/shared/components';

import type { WeavingInvoice } from './types';
import { WeavingInvoiceForm } from './WeavingInvoiceForm';
import { WeavingInvoiceList } from './WeavingInvoiceList';
import { WEAVING_INVOICE_MESSAGES as MSG } from './weaving-invoices.constants';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
        <div className="bg-surface p-6 rounded-xl shadow-xl flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-muted-foreground">
            {MSG.LOADING_INVOICE}
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
      <PageLayout className="flex-1 h-full">
        <WeavingInvoiceList onNew={openCreate} onEdit={openEdit} />
      </PageLayout>
      {showForm && (
        <WeavingInvoiceFormWrapper
          invoiceId={editInvoiceId}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
