import { useState } from 'react';

import type { WeavingInvoice } from './types';
import { WeavingInvoiceForm } from './WeavingInvoiceForm';
import { WeavingInvoiceList } from './WeavingInvoiceList';

export function WeavingInvoicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState<WeavingInvoice | null>(null);

  function openCreate() {
    setEditInvoice(null);
    setShowForm(true);
  }

  function openEdit(inv: WeavingInvoice) {
    setEditInvoice(inv);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditInvoice(null);
  }

  return (
    <>
      <WeavingInvoiceList onNew={openCreate} onEdit={openEdit} />
      {showForm && (
        <WeavingInvoiceForm invoice={editInvoice} onClose={closeForm} />
      )}
    </>
  );
}
