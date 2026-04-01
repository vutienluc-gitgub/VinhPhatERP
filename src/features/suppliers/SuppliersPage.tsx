import { useState } from 'react'

import { SupplierForm } from './SupplierForm'
import { SuppliersList } from './SuppliersList'
import type { Supplier } from './types'

export function SuppliersPage() {
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openCreate() {
    setEditSupplier(null)
    setShowForm(true)
  }

  function openEdit(supplier: Supplier) {
    setEditSupplier(supplier)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditSupplier(null)
  }

  return (
    <>
      <SuppliersList onEdit={openEdit} onNew={openCreate} />
      {showForm && <SupplierForm supplier={editSupplier} onClose={closeForm} />}
    </>
  )
}