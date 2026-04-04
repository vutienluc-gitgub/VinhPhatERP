import { useState } from 'react';
import { Layers, Plus, Filter, Search } from 'lucide-react';
import { useBomList, useApproveBom, useDeprecateBom, useReviseBom } from './useBom';
import { BomList } from './BomList';
import { BomForm } from './BomForm';
import { BomDetail } from './BomDetail';
import { BomTemplate, BomStatus, BomFilter } from './types';
import { BOM_STATUSES, BOM_STATUS_LABELS } from './bom.module';

export function BomPage() {
  const [filter, setFilter] = useState<BomFilter>({});
  const [viewState, setViewState] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedBom, setSelectedBom] = useState<BomTemplate | null>(null);

  const { data: boms = [], isLoading } = useBomList(filter);
  const approveBom = useApproveBom();
  const deprecateBom = useDeprecateBom();
  const reviseBom = useReviseBom();

  const handleCreate = () => {
    setSelectedBom(null);
    setViewState('create');
  };

  const handleEdit = (bom: BomTemplate) => {
    setSelectedBom(bom);
    setViewState('edit');
  };

  const handleSelect = (bom: BomTemplate) => {
    setSelectedBom(bom);
    setViewState('detail');
  };

  const handleCancelForm = () => {
    setViewState('list');
    setSelectedBom(null);
  };

  const handleSuccessForm = () => {
    setViewState('list');
    setSelectedBom(null);
  };

  // --- Task based actions ---
  const handleApprove = async () => {
    if (!selectedBom) return;
    const confirm = window.confirm(`Bạn có chắc chắn muốn duyệt BOM ${selectedBom.code}?`);
    if (!confirm) return;

    try {
      await approveBom.mutateAsync({ id: selectedBom.id, reason: 'Phê duyệt ban đầu' });
      // Go back to list or stay in detail? let's stay in detail, but update selectedBom would be nice. Let's just go back to list
      setViewState('list');
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert('An unexpected error occurred');
      }
    }
  };

  const handleDeprecate = async () => {
    if (!selectedBom) return;
    const reason = window.prompt(`Lý do ngưng áp dụng (báo phế) BOM ${selectedBom.code}?`);
    if (!reason) return;

    try {
      await deprecateBom.mutateAsync({ id: selectedBom.id, reason });
      setViewState('list');
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert('An unexpected error occurred');
      }
    }
  };

  const handleRevise = async () => {
    if (!selectedBom) return;
    const reason = window.prompt(`Lý do tạo phiên bản mới từ BOM ${selectedBom.code}?`);
    if (!reason) return;

    try {
      await reviseBom.mutateAsync({ id: selectedBom.id, reason });
      setViewState('list');
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert('An unexpected error occurred');
      }
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            Định mức (BOM)
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            Quản lý công thức sử dụng nguyên liệu sợi cho từng loại vải mộc đầu ra.
            Dữ liệu định mức được quản lý qua hệ thống phiên bản (immutable) và xét duyệt.
          </p>
        </div>
        {viewState === 'list' && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Bản Nháp</span>
          </button>
        )}
      </div>

      {(viewState === 'create' || viewState === 'edit') && (
        <BomForm
          initialData={selectedBom || undefined}
          onSuccess={handleSuccessForm}
          onCancel={handleCancelForm}
        />
      )}

      {viewState === 'detail' && selectedBom && (
        <BomDetail
          bom={selectedBom}
          onBack={handleCancelForm}
          onApprove={handleApprove}
          onDeprecate={handleDeprecate}
          onRevise={handleRevise}
          isSaving={approveBom.isPending || deprecateBom.isPending || reviseBom.isPending}
        />
      )}

      {viewState === 'list' && (
        <>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm mã, tên BOM..."
                className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                value={filter.search || ''}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
            <div className="sm:w-64 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                value={filter.status || ''}
                onChange={(e) => setFilter({ ...filter, status: e.target.value as BomStatus || undefined })}
              >
                <option value="">Tất cả trạng thái</option>
                {BOM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {BOM_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="mt-4 text-slate-500">Đang tải danh sách BOM...</p>
            </div>
          ) : (
            <BomList
              boms={boms}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDeprecate={(bom) => {
                setSelectedBom(bom);
                handleDeprecate();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
