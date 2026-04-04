import { useState } from 'react';
import { Plus } from 'lucide-react';
import { WorkOrderList } from './WorkOrderList';
import { WorkOrderForm } from './WorkOrderForm';
import { WorkOrderDetail } from './WorkOrderDetail';

export function WorkOrdersPage() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleView = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedId(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
  };

  if (view === 'detail' && selectedId) {
    return (
      <div className="space-y-6">
        <WorkOrderDetail id={selectedId} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Dây chuyền sản xuất</p>
            <h3>Quản Lý Lệnh Sản Xuất</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Điều phối quy trình dệt mộc và tự động cấp phát định mức nguyên liệu theo BOM
            </p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="btn-primary"
            style={{ paddingLeft: '1rem' }}
          >
            <Plus className="h-5 w-5" />
            Kiến tạo Lệnh Sản Xuất
          </button>
        </div>
      </div>

      <div className="flex-1 px-5">
        <WorkOrderList onView={handleView} />
      </div>

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-sheet" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Kiến tạo Lệnh Sản Xuất Mới</h3>
              <button onClick={() => setIsFormOpen(false)} className="btn-icon">×</button>
            </div>
            <div className="modal-content">
               <WorkOrderForm 
                  onSuccess={handleFormSuccess} 
                  onCancel={() => setIsFormOpen(false)} 
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
