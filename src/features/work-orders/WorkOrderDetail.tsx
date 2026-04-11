import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';
import { formatCurrency } from '@/shared/utils/format';

import type { WorkOrder } from './types';
import {
  useWorkOrderDetail,
  useWorkOrderRequirements,
  useStartWorkOrder,
  useCompleteWorkOrder,
} from './useWorkOrders';
import { WORK_ORDER_STATUSES } from './work-orders.module';

interface WorkOrderDetailProps {
  id: string;
  onBack: () => void;
  onEdit: (wo: WorkOrder) => void;
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'info';
    case 'cancelled':
      return 'danger';
    default:
      return 'gray';
  }
}

export function WorkOrderDetail({ id, onBack, onEdit }: WorkOrderDetailProps) {
  const { data: wo, isLoading } = useWorkOrderDetail(id);
  const { data: requirements, isLoading: isLoadingReq } =
    useWorkOrderRequirements(id);
  const startMutation = useStartWorkOrder();
  const completeMutation = useCompleteWorkOrder();

  if (isLoading)
    return (
      <div className="panel-card p-12 flex flex-col items-center gap-3">
        <div className="spinner" />
        <p className="text-muted text-sm">Đang tải chi tiết lệnh...</p>
      </div>
    );
  if (!wo)
    return (
      <p className="error-inline p-8">
        Lệnh sản xuất không tồn tại hoặc bạn không có quyền xem.
      </p>
    );

  const statusConfig = WORK_ORDER_STATUSES[wo.status];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Card */}
      <div className="panel-card card-flush">
        <div className="card-header-area card-header-premium">
          <div className="flex items-center gap-3">
            <button
              className="btn-icon"
              type="button"
              onClick={onBack}
              title="Quay lai"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div>
              <p className="eyebrow-premium">CHI TIẾT LỆNH SẢN XUẤT</p>
              <h3 className="title-premium flex items-center gap-3">
                {wo.work_order_number}
                <Badge variant={getStatusVariant(wo.status)}>
                  {statusConfig?.label}
                </Badge>
              </h3>
              {wo.order && (
                <p className="text-xs text-muted mt-0.5">
                  Sản xuất cho ĐH: {wo.order.order_number}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {wo.status === 'draft' && (
              <button
                className="btn-secondary flex items-center gap-2"
                type="button"
                onClick={() => onEdit(wo)}
              >
                <Icon name="Edit2" size={16} />
                Sửa lệnh
              </button>
            )}
            {wo.status === 'draft' && (
              <button
                className="btn-primary flex items-center gap-2"
                type="button"
                onClick={() => startMutation.mutate(wo.id)}
                disabled={startMutation.isPending}
              >
                <Icon name="Play" size={16} />
                Bắt đầu dệt
              </button>
            )}
            {wo.status === 'in_progress' && (
              <button
                className="btn-primary flex items-center gap-2"
                type="button"
                onClick={() => {
                  const yieldP = prompt(
                    `Nhập sản lượng mộc thu được thực tế (m)\nMục tiêu: ${wo.target_quantity_m}m`,
                  );
                  if (yieldP) {
                    completeMutation.mutate({
                      id: wo.id,
                      input: { actual_yield_m: parseFloat(yieldP) },
                    });
                  }
                }}
              >
                <Icon name="CheckCircle" size={16} />
                Hoàn thành dệt
              </button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="form-field">
              <label>BOM định mức</label>
              <p className="font-bold">
                {wo.bom_template?.code} (V{wo.bom_version})
              </p>
            </div>
            <div className="form-field">
              <label>Vải mục tiêu</label>
              <p className="font-bold">
                {wo.bom_template?.target_fabric?.name || '—'}
              </p>
            </div>
            <div className="form-field">
              <label>Ngày tạo lệnh</label>
              <p>{new Date(wo.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="form-field">
              <label>Hao hụt (%)</label>
              <p className="font-bold text-warning">{wo.standard_loss_pct}%</p>
            </div>
            <div className="form-field">
              <label>Đơn hàng liên kết</label>
              <p>{wo.order?.order_number || 'Sản xuất dự trữ'}</p>
            </div>
            <div className="form-field">
              <label>Đối tác dệt</label>
              <p className="font-bold text-primary">
                {wo.supplier?.name || '—'}
              </p>
            </div>
            <div className="form-field">
              <label>Đơn giá dệt</label>
              <p className="font-bold">
                {formatCurrency(wo.weaving_unit_price)}đ/m
              </p>
            </div>
            <div className="form-field">
              <label>Tổng phí dự kiến</label>
              <p className="font-bold text-success">
                {formatCurrency(wo.target_quantity_m * wo.weaving_unit_price)}đ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Yarn Requirements */}
      <div className="panel-card card-flush">
        <div className="card-header-area card-header-premium">
          <div className="flex items-center gap-2">
            <Icon name="Package" size={20} className="text-primary" />
            <h3 className="title-premium">Nhu cầu & Xuất kho sợi</h3>
          </div>
        </div>

        {isLoadingReq ? (
          <div className="p-8 text-center text-sm text-muted">Đang tải...</div>
        ) : !requirements || requirements.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            Chưa có dữ liệu tính toán nhu cầu sợi.
          </div>
        ) : (
          <div className="card-table-section">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loại sợi</th>
                  <th className="hide-mobile">Mã màu</th>
                  <th className="text-right">% BOM</th>
                  <th className="text-right">Cần (kg)</th>
                  <th className="text-right">Đã xuất</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong>{req.yarn_catalog?.name || '—'}</strong>
                    </td>
                    <td className="hide-mobile td-muted">
                      {req.yarn_catalog?.color_name || '—'}
                    </td>
                    <td className="text-right">{req.bom_ratio_pct}%</td>
                    <td className="text-right font-bold text-primary">
                      {req.required_kg.toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                      })}
                    </td>
                    <td className="text-right font-bold text-success">
                      {req.allocated_kg.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-surface-subtle">
                  <td colSpan={2} className="text-right">
                    TONG CONG:
                  </td>
                  <td className="text-right">
                    {requirements.reduce(
                      (sum, r) => sum + Number(r.bom_ratio_pct),
                      0,
                    )}
                    %
                  </td>
                  <td className="text-right text-primary">
                    {requirements
                      .reduce((sum, r) => sum + Number(r.required_kg), 0)
                      .toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}{' '}
                    kg
                  </td>
                  <td className="text-right text-success">
                    {requirements
                      .reduce((sum, r) => sum + Number(r.allocated_kg), 0)
                      .toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}{' '}
                    kg
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats — target & results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="panel-card p-5">
          <p className="eyebrow-premium mb-3">Mục tiêu sản xuất</p>
          <div className="flex flex-col gap-2">
            <div className="stat-card">
              <span className="stat-label">Tổng mét mục tiêu</span>
              <span className="stat-value text-primary">
                {wo.target_quantity_m.toLocaleString()} m
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Khối lượng mộc dự kiến</span>
              <span className="stat-value">
                {wo.target_weight_kg
                  ? `${wo.target_weight_kg.toLocaleString()} kg`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="panel-card p-5">
          <p className="eyebrow-premium mb-3">Kết quả thực tế</p>
          {wo.status === 'completed' ? (
            <div className="flex flex-col gap-2">
              <div className="stat-card">
                <span className="stat-label">Sản lượng mộc thu được</span>
                <span className="stat-value text-success">
                  {wo.actual_yield_m?.toLocaleString()} m
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Hiệu suất (Yield Rate)</span>
                <span className="stat-value">
                  {(
                    ((wo.actual_yield_m || 0) / wo.target_quantity_m) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Icon name="Scissors" size={40} className="opacity-20" />
              <p className="text-sm text-muted">
                Đang đợi kết quả từ xưởng dệt...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
