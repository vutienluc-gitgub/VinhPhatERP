import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useContextualGuide } from '@/features/guide-system/hooks/useContextualGuide';
import { ContextualGuide } from '@/features/guide-system/components/ContextualGuide';
import type { QuotationsFormValues } from '@/schema/quotation.schema';

import { QuotationDetail } from './QuotationDetail';
import { QuotationForm } from './QuotationForm';
import { QuotationList } from './QuotationList';
import type { Quotation } from './types';

type View = { mode: 'list' } | { mode: 'detail'; quotationId: string };

export function QuotationsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [view, setView] = useState<View>({ mode: 'list' });
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [initialData, setInitialData] =
    useState<Partial<QuotationsFormValues> | null>(null);

  useEffect(() => {
    // If navigated from CRM Lead "Convert to Quote"
    if (location.state?.createFromLead && location.state?.initialData) {
      setInitialData(location.state.initialData);
      setEditQuotation(null);
      setShowForm(true);

      // Clear state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const { activeGuides } = useContextualGuide(
    'Quotations',
    view.mode === 'detail' ? view.quotationId : undefined,
    view.mode,
  );

  function openCreate() {
    setInitialData(null);
    setEditQuotation(null);
    setShowForm(true);
  }

  function openEdit(quotation: Quotation) {
    setEditQuotation(quotation);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditQuotation(null);
    setInitialData(null);
  }

  return (
    <div className="page-container">
      {view.mode === 'list' ? (
        <QuotationList
          onNew={openCreate}
          onEdit={(q) => {
            if (q.status === 'draft' || q.status === 'sent') openEdit(q);
            else
              setView({
                mode: 'detail',
                quotationId: q.id,
              });
          }}
          onView={(q) =>
            setView({
              mode: 'detail',
              quotationId: q.id,
            })
          }
        />
      ) : (
        <QuotationDetail
          quotationId={view.quotationId}
          onBack={() => setView({ mode: 'list' })}
          onEdit={(q) => openEdit(q)}
          onViewOrder={() => {
            navigate('/orders');
          }}
        />
      )}

      {showForm && (
        <QuotationForm
          quotation={editQuotation}
          initialData={initialData ?? undefined}
          onClose={closeForm}
        />
      )}

      <ContextualGuide activeGuides={activeGuides} />
    </div>
  );
}
