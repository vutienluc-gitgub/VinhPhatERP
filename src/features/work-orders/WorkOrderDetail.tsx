import { ArrowLeft, CheckCircle, Play, Scissors, Package } from 'lucide-react'
import { useWorkOrderDetail, useWorkOrderRequirements, useStartWorkOrder, useCompleteWorkOrder } from './useWorkOrders'
import { WORK_ORDER_STATUSES } from './work-orders.module'

interface WorkOrderDetailProps {
  id: string
  onBack: () => void
}

export function WorkOrderDetail({ id, onBack }: WorkOrderDetailProps) {
  const { data: wo, isLoading } = useWorkOrderDetail(id)
  const { data: requirements, isLoading: isLoadingReq } = useWorkOrderRequirements(id)
  const startMutation = useStartWorkOrder()
  const completeMutation = useCompleteWorkOrder()

  if (isLoading) return <div className="table-empty" style={{ padding: '3rem' }}>Đang tải chi tiết lệnh...</div>
  if (!wo) return <p className="error-inline">Lệnh sản xuất không tồn tại</p>

  const statusConfig = WORK_ORDER_STATUSES[wo.status]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="btn-icon" type="button" onClick={onBack} title="Quay lại">
                <ArrowLeft style={{ width: 18, height: 18 }} />
              </button>
              <div>
                <p className="eyebrow">Chi tiết lệnh sản xuất</p>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {wo.work_order_number}
                  <span className={`roll-status ${wo.status}`}>{statusConfig?.label}</span>
                </h3>
                {wo.order && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                    Sản xuất cho ĐH: {wo.order.order_number}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {wo.status === 'draft' && (
                <button
                  className="primary-button btn-standard"
                  type="button"
                  onClick={() => startMutation.mutate(wo.id)}
                  disabled={startMutation.isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Play style={{ width: 16, height: 16 }} />
                  Bắt đầu dệt
                </button>
              )}
              {wo.status === 'in_progress' && (
                <button
                  className="primary-button btn-standard"
                  type="button"
                  style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => {
                    const yieldP = prompt(`Nhập sản lượng MỘC thu được thực tế (m)\nMục tiêu: ${wo.target_quantity_m}m`)
                    if (yieldP) {
                      completeMutation.mutate({ id: wo.id, input: { actual_yield_m: parseFloat(yieldP) } })
                    }
                  }}
                >
                  <CheckCircle style={{ width: 16, height: 16 }} />
                  Hoàn thành dệt
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info fields inside header card */}
        <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="form-field">
              <label>BOM Định Mức</label>
              <p style={{ fontWeight: 700, margin: 0 }}>{wo.bom_template?.code} (V{wo.bom_version})</p>
            </div>
            <div className="form-field">
              <label>Vải mục tiêu</label>
              <p style={{ fontWeight: 600, margin: 0 }}>{wo.bom_template?.target_fabric?.name || '—'}</p>
            </div>
            <div className="form-field">
              <label>Ngày tạo lệnh</label>
              <p style={{ margin: 0 }}>{new Date(wo.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="form-field">
              <label>Hao hụt (%)</label>
              <p style={{ fontWeight: 700, color: 'var(--warning)', margin: 0 }}>{wo.standard_loss_pct}%</p>
            </div>
            <div className="form-field">
              <label>Đơn hàng liên kết</label>
              <p style={{ margin: 0 }}>{wo.order?.order_number || 'Không'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Yarn Requirements */}
      <div className="panel-card card-flush">
        <div className="card-header-area">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package style={{ width: 20, height: 20, color: 'var(--primary)' }} />
              <h3>Nhu cầu & Xuất kho sợi</h3>
            </div>
          </div>
        </div>

        {isLoadingReq ? (
          <div className="table-empty">Đang tải...</div>
        ) : !requirements || requirements.length === 0 ? (
          <div className="table-empty">Chưa có dữ liệu tính toán nhu cầu sợi.</div>
        ) : (
          <div className="data-table-wrap card-table-section">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loại Sợi</th>
                  <th className="hide-mobile">Mã Màu</th>
                  <th className="text-right">% BOM</th>
                  <th className="text-right">Cần (kg)</th>
                  <th className="text-right">Đã xuất</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => (
                  <tr key={req.id}>
                    <td><strong>{req.yarn_catalog?.name || '—'}</strong></td>
                    <td className="hide-mobile td-muted">{req.yarn_catalog?.color_name || '—'}</td>
                    <td className="text-right">{req.bom_ratio_pct}%</td>
                    <td className="text-right" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {req.required_kg.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </td>
                    <td className="text-right" style={{ fontWeight: 700, color: 'var(--success)' }}>
                      {req.allocated_kg.toLocaleString()}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--surface)', fontWeight: 700 }}>
                  <td colSpan={2} className="text-right">TỔNG CỘNG:</td>
                  <td className="text-right">
                    {requirements.reduce((sum, r) => sum + Number(r.bom_ratio_pct), 0)}%
                  </td>
                  <td className="text-right" style={{ color: 'var(--primary)' }}>
                    {requirements.reduce((sum, r) => sum + Number(r.required_kg), 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
                  </td>
                  <td className="text-right" style={{ color: 'var(--success)' }}>
                    {requirements.reduce((sum, r) => sum + Number(r.allocated_kg), 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats sidebar — target & results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="panel-card">
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Mục tiêu sản xuất</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="stat-card">
              <span className="stat-label">Tổng mét mục tiêu</span>
              <span className="stat-value" style={{ color: 'var(--primary)' }}>{wo.target_quantity_m.toLocaleString()} m</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Khối lượng mộc dự kiến</span>
              <span className="stat-value">{wo.target_weight_kg ? `${wo.target_weight_kg.toLocaleString()} kg` : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Kết quả thực tế</p>
          {wo.status === 'completed' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="stat-card">
                <span className="stat-label">Sản lượng mộc thu được</span>
                <span className="stat-value" style={{ color: 'var(--success)' }}>{wo.actual_yield_m?.toLocaleString()} m</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Hiệu suất (Yield Rate)</span>
                <span className="stat-value">
                  {((wo.actual_yield_m || 0) / wo.target_quantity_m * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="table-empty" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
              <Scissors style={{ width: 40, height: 40, opacity: 0.15, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem' }}>Đang đợi kết quả từ xưởng dệt...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
