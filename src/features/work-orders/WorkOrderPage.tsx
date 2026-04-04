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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
            Quản Lý Sản Xuất (Work Orders)
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Điều phối lệnh sản xuất lô mộc tự động cấp phát định mức nguyên liệu
          </p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo lệnh SX
        </button>
      </div>

      <div className="flex-1">
        <WorkOrderList onView={handleView} />
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsFormOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Kiến tạo Lệnh Sản Xuất
                    </h3>
                    <div className="mt-4">
                       <WorkOrderForm 
                          onSuccess={handleFormSuccess} 
                          onCancel={() => setIsFormOpen(false)} 
                       />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
