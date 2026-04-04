import { Edit2, History, AlertTriangle } from 'lucide-react';
import { BomTemplate, BomStatus } from './types';
import { BOM_STATUS_LABELS, BOM_STATUS_COLORS } from './bom.module';

interface BomListProps {
  boms: BomTemplate[];
  onSelect: (bom: BomTemplate) => void;
  onEdit: (bom: BomTemplate) => void;
  onDeprecate: (bom: BomTemplate) => void;
}

export function BomList({ boms, onSelect, onEdit, onDeprecate }: BomListProps) {
  if (boms.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
        <p className="text-slate-500 mb-4">Chưa có công thức định mức (BOM) nào</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
          <tr>
            <th className="py-3 px-4">Mã BOM</th>
            <th className="py-3 px-4">Tên Công Thức</th>
            <th className="py-3 px-4">Sản Phẩm Mục Tiêu</th>
            <th className="py-3 px-4">Phiên Bản</th>
            <th className="py-3 px-4">Trạng Thái</th>
            <th className="py-3 px-4">Người Tạo / Duyệt</th>
            <th className="py-3 px-4 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {boms.map((bom) => {
            const statusLabel = BOM_STATUS_LABELS[bom.status as BomStatus] || bom.status;
            const statusColor = BOM_STATUS_COLORS[bom.status as BomStatus] || 'slate';
            
            return (
              <tr key={bom.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-medium text-slate-800">
                  <span className="cursor-pointer text-indigo-600 hover:text-indigo-800" onClick={() => onSelect(bom)}>
                    {bom.code}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">{bom.name}</td>
                <td className="py-3 px-4 text-slate-600">
                  {bom.fabric_catalogs?.name || '---'} {bom.target_width_cm ? `(${bom.target_width_cm}cm` : ''} {bom.target_gsm ? `${bom.target_gsm}gsm)` : ''}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-800">
                    v{bom.active_version}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-700`}>
                    {statusLabel}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-xs text-slate-500">Tạo: {bom.created_by_profile?.full_name || 'N/A'}</div>
                  {bom.status === 'approved' && (
                    <div className="text-xs text-emerald-600 mt-1">Duyệt: {bom.approved_by_profile?.full_name || 'N/A'}</div>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => onSelect(bom)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Xem chi tiết"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  {bom.status === 'draft' && (
                    <button
                      onClick={() => onEdit(bom)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Sửa bản nháp"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {bom.status === 'approved' && (
                    <button
                      onClick={() => onDeprecate(bom)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Báo phế"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
