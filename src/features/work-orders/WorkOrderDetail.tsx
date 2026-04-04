import { ArrowLeft, CheckCircle, Package, Scissors, Play } from 'lucide-react';
import { useWorkOrderDetail, useWorkOrderRequirements, useStartWorkOrder, useCompleteWorkOrder } from './useWorkOrders';
import { WORK_ORDER_STATUSES } from './work-orders.module';

interface WorkOrderDetailProps {
  id: string;
  onBack: () => void;
}

export function WorkOrderDetail({ id, onBack }: WorkOrderDetailProps) {
  const { data: wo, isLoading } = useWorkOrderDetail(id);
  const { data: requirements, isLoading: isLoadingReq } = useWorkOrderRequirements(id);
  const startMutation = useStartWorkOrder();
  const completeMutation = useCompleteWorkOrder();

  if (isLoading) return <div className="p-8 text-center text-neutral-500">Đang tải chi tiết lệnh...</div>;
  if (!wo) return <div className="p-8 text-center text-red-500">Lệnh sản xuất không tồn tại</div>;

  const statusConfig = WORK_ORDER_STATUSES[wo.status];
  
  return (
    <div className="space-y-6 pb-12">
      {/* Header operations */}
      <div className="card-header-area">
        <div className="page-header">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="btn-icon">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="eyebrow">Chi tiết lệnh sản xuất</p>
              <h2 className="flex items-center gap-3">
                {wo.work_order_number}
                <span className={`roll-status ${wo.status}`}>
                  {statusConfig?.label}
                </span>
              </h2>
              {wo.order && (
                <p className="text-sm text-neutral-500 mt-1">Sản xuất cho ĐH: {wo.order.order_number}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {wo.status === 'draft' && (
               <button 
                 className="btn-primary"
                 onClick={() => startMutation.mutate(wo.id)} 
                 disabled={startMutation.isPending}
               >
                 <Play className="w-4 h-4 mr-2" /> Bắt đầu dệt
               </button>
            )}
            {wo.status === 'in_progress' && (
               <button 
                  className="btn-primary"
                  style={{ background: 'var(--success)' }}
                  onClick={() => {
                    const yieldP = prompt(`Nhập sản lượng MỘC thu được thực tế (m)\nMục tiêu: ${wo.target_quantity_m}m`);
                    if (yieldP) {
                      completeMutation.mutate({ id: wo.id, input: { actual_yield_m: parseFloat(yieldP) }});
                    }
                  }}
               >
                 <CheckCircle className="w-4 h-4 mr-2" /> Hoàn thành dệt
               </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-5">
        {/* Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="panel-card">
            <div className="card-header-area">
               <h3 className="text-lg font-bold">Thông tin kỹ thuật & Kế hoạch</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="form-field">
                  <label>BOM Định Mức</label>
                  <div className="font-bold text-slate-800">{wo.bom_template?.code} (V{wo.bom_version})</div>
                </div>
                <div className="form-field">
                  <label>Vải mục tiêu</label>
                  <div className="font-bold text-slate-700">{wo.bom_template?.target_fabric?.name || '-'}</div>
                </div>
                <div className="form-field">
                  <label>Ngày tạo lệnh</label>
                  <div className="font-medium">{new Date(wo.created_at).toLocaleDateString('vi-VN')}</div>
                </div>
                <div className="form-field">
                  <label>Hao hụt vải mộc (%)</label>
                  <div className="font-bold text-amber-700">{wo.standard_loss_pct}% (Chuẩn)</div>
                </div>
                <div className="form-field">
                  <label>Đơn hàng liên kết</label>
                  <div className="font-medium">{wo.order?.order_number || 'Khống'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Yarn Requirements Box */}
          <div className="panel-card card-flush">
            <div className="card-header-area flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold">Nhu cầu & Xuất kho sợi</h3>
              </div>
            </div>
            
            {isLoadingReq ? (
               <div className="table-empty">Đang tải...</div>
            ) : !requirements || requirements.length === 0 ? (
               <div className="table-empty">
                  Chưa có dữ liệu tính toán nhu cầu sợi.
               </div>
            ) : (
              <div className="data-table-wrap" style={{ border: 'none', borderTop: '1px solid var(--border)', borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Loại Sợi</th>
                      <th>Mã Màu</th>
                      <th className="text-right">% BOM</th>
                      <th className="text-right">Cần (kg)</th>
                      <th className="text-right" style={{ background: 'rgba(12, 143, 104, 0.05)' }}>Đã xuất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div className="font-bold">{req.yarn_catalog?.name || '—'}</div>
                        </td>
                        <td className="td-muted">{req.yarn_catalog?.color_name || '—'}</td>
                        <td className="text-right">{req.bom_ratio_pct}%</td>
                        <td className="text-right" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>
                          {req.required_kg.toLocaleString(undefined, {minimumFractionDigits: 1})}
                        </td>
                        <td className="text-right" style={{ background: 'rgba(12, 143, 104, 0.05)', fontWeight: 700, color: 'var(--success)' }}>
                          {req.allocated_kg.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--surface)', fontWeight: 700 }}>
                      <td colSpan={2} className="text-right">TỔNG CỘNG:</td>
                      <td className="text-right">
                        {requirements.reduce((sum, r) => sum + Number(r.bom_ratio_pct), 0)}%
                      </td>
                      <td className="text-right" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                        {requirements.reduce((sum, r) => sum + Number(r.required_kg), 0).toLocaleString(undefined, {maximumFractionDigits: 1})} kg
                      </td>
                      <td className="text-right" style={{ color: 'var(--success)', fontSize: '1.1rem', background: 'rgba(12, 143, 104, 0.05)' }}>
                        {requirements.reduce((sum, r) => sum + Number(r.allocated_kg), 0).toLocaleString(undefined, {maximumFractionDigits: 1})} kg
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Vertical stats column */}
        <div className="space-y-6">
          <div className="panel-card bg-indigo-50/30 border-indigo-100">
            <div className="p-6">
              <p className="eyebrow text-indigo-600 mb-4">Mục tiêu sản xuất</p>
              <div className="space-y-6">
                <div className="stat-card" style={{ background: 'white' }}>
                  <span className="stat-label">Tổng mét mục tiêu</span>
                  <span className="stat-value text-indigo-700">{wo.target_quantity_m.toLocaleString()} m</span>
                </div>
                <div className="stat-card" style={{ background: 'white' }}>
                  <span className="stat-label">Khối lượng mộc dự kiến</span>
                  <span className="stat-value">{wo.target_weight_kg ? `${wo.target_weight_kg.toLocaleString()} kg` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`panel-card ${wo.status === 'completed' ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
            <div className="p-6">
              <p className="eyebrow mb-4">Kết quả thực tế</p>
              {wo.status === 'completed' ? (
                <div className="space-y-6">
                   <div className="stat-card" style={{ background: 'white' }}>
                    <span className="stat-label">Sản lượng mộc thu được</span>
                    <span className="stat-value text-emerald-700">{wo.actual_yield_m?.toLocaleString()} m</span>
                  </div>
                  <div className="stat-card" style={{ background: 'white' }}>
                    <span className="stat-label">Hiệu suất (Yield Rate)</span>
                    <span className="stat-value">
                       {((wo.actual_yield_m || 0) / wo.target_quantity_m * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-400 gap-3">
                  <Scissors className="w-10 h-10 opacity-20" />
                  <p className="text-sm px-4">Đang đợi kết quả từ xưởng dệt...</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
