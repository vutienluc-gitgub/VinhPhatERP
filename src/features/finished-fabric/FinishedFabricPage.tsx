import { useState } from 'react'

import { FinishedFabricForm } from './FinishedFabricForm'
import { FinishedFabricList } from './FinishedFabricList'
import type { FinishedFabricRoll } from './types'

export function FinishedFabricPage() {
  const [editRoll, setEditRoll] = useState<FinishedFabricRoll | null>(null)
  const [showForm, setShowForm] = useState(false)

  function openCreate() {
    setEditRoll(null)
    setShowForm(true)
  }

  function openEdit(roll: FinishedFabricRoll) {
    setEditRoll(roll)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditRoll(null)
  }

  return (
    <>
      <FinishedFabricList onEdit={openEdit} onNew={openCreate} />
      {showForm && <FinishedFabricForm roll={editRoll} onClose={closeForm} />}
    </>
  )
}