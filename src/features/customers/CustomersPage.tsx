import { useState } from 'react'

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet'

import { CustomerForm } from './CustomerForm'
import { CustomerList } from './CustomerList'
import type { Customer } from './types'

export function CustomersPage() {
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openCreate() {
    setEditCustomer(null)
    setShowForm(true)
  }

  function openEdit(customer: Customer) {
    setEditCustomer(customer)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditCustomer(null)
  }

  return (
    <>
      <CustomerList onEdit={openEdit} onNew={openCreate} />
      
      <AdaptiveSheet
        open={showForm}
        onClose={closeForm}
        title={editCustomer ? `Sửa: ${editCustomer.name}` : 'Thêm khách hàng mới'}
      >
        <CustomerForm customer={editCustomer} onClose={closeForm} />
      </AdaptiveSheet>
    </>
  )
}