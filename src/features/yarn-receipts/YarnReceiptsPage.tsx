import { useState } from 'react'

import { YarnReceiptForm } from './YarnReceiptForm'
import { YarnReceiptList } from './YarnReceiptList'
import type { YarnReceipt } from './types'
import { useYarnReceipt } from './useYarnReceipts'

export function YarnReceiptsPage() {
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: editReceipt } = useYarnReceipt(editId ?? undefined)

  function openCreate() {
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(receipt: YarnReceipt) {
    setEditId(receipt.id)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
  }

  return (
    <>
      <YarnReceiptList onEdit={openEdit} onNew={openCreate} />
      {showForm && (
        <YarnReceiptForm
          receipt={editId && editReceipt ? (editReceipt as unknown as YarnReceipt) : null}
          onClose={closeForm}
        />
      )}
    </>
  )
}