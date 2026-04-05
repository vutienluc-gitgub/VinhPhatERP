import { useState } from 'react'
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet'

import { QuotationDetail } from './QuotationDetail'
import { QuotationForm } from './QuotationForm'
import { QuotationList } from './QuotationList'
import type { Quotation } from './types'

type View = { mode: 'list' } | { mode: 'detail'; quotationId: string }

export function QuotationsPage() {
  const [view, setView] = useState<View>({ mode: 'list' })
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openCreate() {
    setEditQuotation(null)
    setShowForm(true)
  }

  function openEdit(quotation: Quotation) {
    setEditQuotation(quotation)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditQuotation(null)
  }

  return (
    <>
      {view.mode === 'list' ? (
        <QuotationList
          onNew={openCreate}
          onEdit={(q) => {
            if (q.status === 'draft' || q.status === 'sent') openEdit(q)
            else setView({ mode: 'detail', quotationId: q.id })
          }}
          onView={(q) => setView({ mode: 'detail', quotationId: q.id })}
        />
      ) : (
        <QuotationDetail
          quotationId={view.quotationId}
          onBack={() => setView({ mode: 'list' })}
          onEdit={(q) => openEdit(q)}
          onViewOrder={() => {
            // Navigate to orders page — could use router in the future
            window.location.hash = '#/orders'
          }}
        />
      )}

      <AdaptiveSheet
        open={showForm}
        onClose={closeForm}
        title={editQuotation ? `Sửa báo giá: ${editQuotation.quotation_number}` : 'Tạo báo giá mới'}
        maxWidth={780}
      >
        <QuotationForm
          quotation={editQuotation}
          onClose={closeForm}
        />
      </AdaptiveSheet>
    </>
  )
}
