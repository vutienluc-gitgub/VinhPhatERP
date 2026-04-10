import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';

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
        <p className="text-muted text-sm">Dang tai chi tiet lenh...</p>
      </div>
    );
  if (!wo)
    return (
      <p className="error-inline p-8">
        Lenh san xuat khong ton tai hoac ban khong co quyen xem.
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
              <Icon name="ArrowLeft" size={18} />
            </button>
            <div>
              <p className="eyebrow-premium">CHI TIET LENH SAN XUAT</p>
              <h3 className="title-premium flex items-center gap-3">
                {wo.work_order_number}
                <Badge variant={getStatusVariant(wo.status)}>
                  {statusConfig?.label}
                </Badge>
              </h3>
              {wo.order && (
                <p className="text-xs text-muted mt-0.5">
                  San xuat cho DH: {wo.order.order_number}
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
                Sua lenh
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
                Bat dau det
              </button>
            )}
            {wo.status === 'in_progress' && (
              <button
                className="btn-primary flex items-center gap-2"
                type="button"
                onClick={() => {
                  const yieldP = prompt(
                    `Nhap san luong MOC thu duoc thuc te (m)\nMuc tieu: ${wo.target_quantity_m}m`,
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
                Hoan thanh det
              </button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="form-field">
              <label>BOM Dinh Muc</label>
              <p className="font-bold">
                {wo.bom_template?.code} (V{wo.bom_version})
              </p>
            </div>
            <div className="form-field">
              <label>Vai muc tieu</label>
              <p className="font-bold">
                {wo.bom_template?.target_fabric?.name || '—'}
              </p>
            </div>
            <div className="form-field">
              <label>Ngay tao lenh</label>
              <p>{new Date(wo.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="form-field">
              <label>Hao hut (%)</label>
              <p className="font-bold text-warning">{wo.standard_loss_pct}%</p>
            </div>
            <div className="form-field">
              <label>Don hang lien ket</label>
              <p>{wo.order?.order_number || 'San xuat du tru'}</p>
            </div>
            <div className="form-field">
              <label>Doi tac det</label>
              <p className="font-bold text-primary">
                {wo.supplier?.name || '—'}
              </p>
            </div>
            <div className="form-field">
              <label>Don gia det</label>
              <p className="font-bold">
                {wo.weaving_unit_price.toLocaleString()}d/m
              </p>
            </div>
            <div className="form-field">
              <label>Tong phi du kien</label>
              <p className="font-bold text-success">
                {(
                  wo.target_quantity_m * wo.weaving_unit_price
                ).toLocaleString()}
                d
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
            <h3 className="title-premium">Nhu cau & Xuat kho soi</h3>
          </div>
        </div>

        {isLoadingReq ? (
          <div className="p-8 text-center text-sm text-muted">Dang tai...</div>
        ) : !requirements || requirements.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            Chua co du lieu tinh toan nhu cau soi.
          </div>
        ) : (
          <div className="card-table-section">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loai Soi</th>
                  <th className="hide-mobile">Ma Mau</th>
                  <th className="text-right">% BOM</th>
                  <th className="text-right">Can (kg)</th>
                  <th className="text-right">Da xuat</th>
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
          <p className="eyebrow-premium mb-3">Muc tieu san xuat</p>
          <div className="flex flex-col gap-2">
            <div className="stat-card">
              <span className="stat-label">Tong met muc tieu</span>
              <span className="stat-value text-primary">
                {wo.target_quantity_m.toLocaleString()} m
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Khoi luong moc du kien</span>
              <span className="stat-value">
                {wo.target_weight_kg
                  ? `${wo.target_weight_kg.toLocaleString()} kg`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="panel-card p-5">
          <p className="eyebrow-premium mb-3">Ket qua thuc te</p>
          {wo.status === 'completed' ? (
            <div className="flex flex-col gap-2">
              <div className="stat-card">
                <span className="stat-label">San luong moc thu duoc</span>
                <span className="stat-value text-success">
                  {wo.actual_yield_m?.toLocaleString()} m
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Hieu suat (Yield Rate)</span>
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
                Dang doi ket qua tu xuong det...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
