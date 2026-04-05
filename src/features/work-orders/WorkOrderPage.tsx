import { useState } from 'react'
import { WorkOrderList } from './WorkOrderList'
import { WorkOrderForm } from './WorkOrderForm'
import { WorkOrderDetail } from './WorkOrderDetail'
import { Portal } from '@/shared/components/Portal'

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

      {isFormOpen && (
        <Portal>
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsFormOpen(false)}>
            <div className="modal-sheet" style={{ maxWidth: '800px' }}>
              <div className="modal-header">
                <h3>Kiến tạo Lệnh Sản Xuất Mới</h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="btn-icon"
                  type="button"
                >
                  ✕
                </button>
              </div>
              <WorkOrderForm
                onSuccess={handleFormSuccess}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
