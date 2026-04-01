import { useState } from 'react'

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
      {showForm && <CustomerForm customer={editCustomer} onClose={closeForm} />}
    </>
  )
}