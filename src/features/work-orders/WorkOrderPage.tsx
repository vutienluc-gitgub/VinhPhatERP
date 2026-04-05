import { useState } from 'react'
import { WorkOrderList } from './WorkOrderList'
import { WorkOrderForm } from './WorkOrderForm'
import { WorkOrderDetail } from './WorkOrderDetail'

export function WorkOrdersPage() {
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleView = (id: string) => {
    setSelectedId(id)
    setView('detail')
  }

  const handleBack = () => {
    setView('list')
    setSelectedId(null)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
  }

  if (view === 'detail' && selectedId) {
    return <WorkOrderDetail id={selectedId} onBack={handleBack} />
  }

  return (
    <>
      <WorkOrderList
        onView={handleView}
        onCreate={() => setIsFormOpen(true)}
      />

      {/* Work Order Form Modal */}
      {isFormOpen && (
        <WorkOrderForm
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </>
  )
}
