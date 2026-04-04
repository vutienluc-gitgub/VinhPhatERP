import { ArrowLeft, CheckCircle, Package, Scissors } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {wo.work_order_number}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig?.color}`}>
                {statusConfig?.label}
              </span>
            </h2>
            {wo.order && (
              <p className="text-sm text-neutral-600 mt-1">Sản xuất cho ĐH: {wo.order.order_number}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {wo.status === 'draft' && (
             <button 
               className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
               onClick={() => startMutation.mutate(wo.id)} 
               disabled={startMutation.isPending}
             >
               Bắt đầu dệt
             </button>
          )}
          {wo.status === 'in_progress' && (
             <button 
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none"
                onClick={() => {
                  const yieldP = prompt(`Nhập sản lượng MỘC thu được thực tế (m)\nMục tiêu: ${wo.target_quantity_m}m`);
                  if (yieldP) {
                    completeMutation.mutate({ id: wo.id, input: { actual_yield_m: parseFloat(yieldP) }});
                  }
                }}
             >
               <CheckCircle className="w-4 h-4 mr-2" /> Hoàn thành
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Box */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Thông tin sản xuất</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <div className="text-sm text-neutral-500">BOM Định Mức</div>
                <div className="font-medium text-sm">{wo.bom_template?.code} (V{wo.bom_version})</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Vải mục tiêu</div>
                <div className="font-medium text-sm text-indigo-700">{wo.bom_template?.target_fabric?.name || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Sản lượng yêu cầu</div>
                <div className="font-medium text-sm">{wo.target_quantity_m.toLocaleString()} m</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Dự tiêu hao mộc</div>
                <div className="font-medium text-sm">{wo.target_weight_kg ? `${wo.target_weight_kg.toLocaleString()} kg` : 'Chưa tính'}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Cấu trúc</div>
                <div className="font-medium text-sm">Hao hụt chuẩn: {wo.standard_loss_pct}%</div>
              </div>
              <div>
                <div className="text-sm text-neutral-500">Ngày tạo lệnh</div>
                <div className="font-medium text-sm">{new Date(wo.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Box */}
        <div className={`bg-white shadow rounded-lg overflow-hidden ${wo.status === 'completed' ? 'border-2 border-emerald-200 bg-emerald-50/20' : ''}`}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Kết quả thực tế</h3>
          </div>
          <div className="p-6 h-full">
            {wo.status === 'completed' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                     <div className="text-xs text-neutral-500 mb-1">Thực thu (mét)</div>
                     <div className="text-2xl font-bold text-emerald-700">{wo.actual_yield_m?.toLocaleString()} m</div>
                     <div className="text-xs text-neutral-400 mt-1">
                       Delta: {((wo.actual_yield_m || 0) - wo.target_quantity_m).toLocaleString()} m
                     </div>
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                     <div className="text-xs text-neutral-500 mb-1">Tỉ lệ đạt (Yield)</div>
                     <div className="text-2xl font-bold">
                        {((wo.actual_yield_m || 0) / wo.target_quantity_m * 100).toFixed(1)}%
                     </div>
                  </div>
                </div>
              </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center py-8 text-neutral-400 gap-2 min-h-[120px]">
                  <Scissors className="w-8 h-8 opacity-20" />
                  <p className="text-sm">Chưa có kết quả. Lệnh đang ở trạng thái {statusConfig?.label.toLowerCase()}.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Yarn Requirements Box */}
      <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-medium">Nhu cầu xuất kho sợi (Yarn Allocation)</h3>
        </div>
        <div className="p-0">
          {isLoadingReq ? (
             <div className="p-6 text-center text-sm text-gray-500">Đang tải...</div>
          ) : !requirements || requirements.length === 0 ? (
             <div className="m-6 p-6 text-center text-neutral-500 border rounded border-dashed bg-gray-50 text-sm">
                Chưa có dữ liệu tính toán nhu cầu sợi. (Vui lòng điền Khối lượng mục tiêu khi tạo lệnh)
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium tracking-wider">Tên Loại Sợi</th>
                    <th className="px-6 py-3 text-left font-medium tracking-wider">Mã Màu</th>
                    <th className="px-6 py-3 text-right font-medium tracking-wider">% Định mức</th>
                    <th className="px-6 py-3 text-right font-medium tracking-wider">Tính toán cần (kg)</th>
                    <th className="px-6 py-3 text-right font-medium tracking-wider bg-emerald-50">Đã xuất (kg)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requirements.map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 border-l border-slate-100">
                        {req.yarn_catalog?.name || 'Sợi không xác định'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{req.yarn_catalog?.color_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{req.bom_ratio_pct}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-indigo-700 text-base">
                        {req.required_kg.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right bg-emerald-50/50 text-emerald-800 font-medium">
                        {req.allocated_kg.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold border-t-2 border-gray-200">
                    <td colSpan={2} className="px-6 py-4 text-right">TỔNG CỘNG:</td>
                    <td className="px-6 py-4 text-right">
                      {requirements.reduce((sum, r) => sum + Number(r.bom_ratio_pct), 0)}%
                    </td>
                    <td className="px-6 py-4 text-right text-indigo-800 text-base">
                      {requirements.reduce((sum, r) => sum + Number(r.required_kg), 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-800 text-base bg-emerald-50/50">
                      {requirements.reduce((sum, r) => sum + Number(r.allocated_kg), 0).toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
