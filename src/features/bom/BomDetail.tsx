import { ArrowLeft, CheckCircle, FileX, GitMerge } from 'lucide-react';
import { BomTemplate, BomStatus } from './types';
import { useBomVersions } from './useBom';
import { BOM_STATUS_LABELS, BOM_STATUS_COLORS } from './bom.module';

interface BomDetailProps {
  bom: BomTemplate;
  onBack: () => void;
  onApprove: () => void;
  onDeprecate: () => void;
  onRevise: () => void;
  isSaving: boolean;
}

export function BomDetail({ bom, onBack, onApprove, onDeprecate, onRevise, isSaving }: BomDetailProps) {
  const { data: versions = [] } = useBomVersions(bom.id);
  const statusLabel = BOM_STATUS_LABELS[bom.status as BomStatus] || bom.status;
  const statusColor = BOM_STATUS_COLORS[bom.status as BomStatus] || 'slate';

  return (
    <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              {bom.code}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                {statusLabel}
              </span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">{bom.name}</p>
          </div>
        </div>

        {/* Task-Based Actions */}
        <div className="flex items-center gap-3">
          {bom.status === 'draft' && (
            <button
              onClick={onApprove}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Phê Duyệt
            </button>
          )}

          {bom.status === 'approved' && (
             <>
              <button
                onClick={onRevise}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <GitMerge className="w-4 h-4 mr-2 text-indigo-500" />
                Tạo Revision (Bản mới)
              </button>
              <button
                onClick={onDeprecate}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                <FileX className="w-4 h-4 mr-2" />
                Báo Phế
              </button>
             </>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Mã sản phẩm mộc</dt>
            <dd className="mt-1 text-sm text-gray-900 font-semibold">{bom.fabric_catalogs?.code} - {bom.fabric_catalogs?.name}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Quy cách đầu ra</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {bom.target_width_cm ? `${bom.target_width_cm}cm` : '--'} / {bom.target_gsm ? `${bom.target_gsm}gsm` : '--'}
            </dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Phiên bản hiện tại</dt>
            <dd className="mt-1 text-sm text-gray-900">v{bom.active_version}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Hao hụt mặc định</dt>
            <dd className="mt-1 text-sm text-gray-900">{bom.standard_loss_pct}%</dd>
          </div>
        </dl>
      </div>

      {/* Ingredients */}
      <div className="mb-10">
        <h4 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Thành Phần Nguyên Liệu (v{bom.active_version})</h4>
        <div className="bg-slate-50 rounded-lg p-1 border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-medium">
              <tr>
                <th className="py-2 px-4 rounded-tl-lg">Loại Sợi</th>
                <th className="py-2 px-4">Thành phần</th>
                <th className="py-2 px-4 text-center">Tỉ lệ (%)</th>
                <th className="py-2 px-4 text-right rounded-tr-lg">Tiêu hao (kg/m)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bom.bom_yarn_items?.map((item) => (
                <tr key={item.id} className="bg-white">
                  <td className="py-3 px-4 font-medium text-gray-800">{item.yarn_catalogs?.code} - {item.yarn_catalogs?.name}</td>
                  <td className="py-3 px-4 text-gray-600">{item.yarn_catalogs?.composition || '--'}</td>
                  <td className="py-3 px-4 text-center text-blue-700 font-semibold">{item.ratio_pct}%</td>
                  <td className="py-3 px-4 text-right text-gray-700">{item.consumption_kg_per_m} kg/m</td>
                </tr>
              ))}
              {(!bom.bom_yarn_items || bom.bom_yarn_items.length === 0) && (
                <tr><td colSpan={4} className="py-4 text-center text-gray-500">Chưa có dữ liệu nguyên liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Version History */}
      <div>
        <h4 className="text-base font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Lịch Sử Phiên Bản (Immutable Ledger)</h4>
        <ul className="space-y-4">
          {versions.map((ver) => (
            <li key={ver.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-600 font-mono text-sm font-bold border border-slate-200">
                    v{ver.version}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ver.change_reason}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Tạo bởi: {ver.created_by_profile?.full_name} • {new Date(ver.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {versions.length === 0 && (
             <p className="text-sm text-gray-500 italic pb-2">Chưa có ảnh chụp lịch sử nào (chưa từng được duyệt).</p>
          )}
        </ul>
      </div>

    </div>
  );
}
