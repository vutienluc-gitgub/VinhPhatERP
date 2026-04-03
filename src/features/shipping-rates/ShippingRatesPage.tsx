import { useState } from 'react'

import { ShippingRateForm } from './ShippingRateForm'
import { ShippingRateList } from './ShippingRateList'
import type { ShippingRate } from './types'

export function ShippingRatesPage() {
  const [editItem, setEditItem] = useState<ShippingRate | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openCreate() {
    setEditItem(null)
    setShowForm(true)
  }

  function openEdit(item: ShippingRate) {
    setEditItem(item)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditItem(null)
  }

  return (
    <>
      <ShippingRateList onEdit={openEdit} onNew={openCreate} />
      {showForm && <ShippingRateForm item={editItem} onClose={closeForm} />}
    </>
  )
}
