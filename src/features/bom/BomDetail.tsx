import { ArrowLeft, CheckCircle, FileX, GitMerge } from '@/shared/icons'
import { BomTemplate, BomStatus } from './types'
import { useBomVersions } from './useBom'
import { BOM_STATUS_LABELS } from './bom.module'

interface BomDetailProps {
  bom: BomTemplate
  onBack: () => void
  onApprove: () => void
  onDeprecate: () => void
  onRevise: () => void
  isSaving: boolean
}

export function BomDetail({ bom, onBack, onApprove, onDeprecate, onRevise, isSaving }: BomDetailProps) {
  const { data: versions = [] } = useBomVersions(bom.id)
  const statusLabel = BOM_STATUS_LABELS[bom.status as BomStatus] || bom.status

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-icon"
              type="button"
              onClick={onBack}
              title="Quay lại"
            >
              <ArrowLeft style={{ width: 18, height: 18 }} />
            </button>
            <div>
              <p className="eyebrow">Chi tiết định mức</p>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {bom.code}
                <span className={`roll-status ${bom.status}`}>{statusLabel}</span>
              </h3>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {bom.status === 'draft' && (
              <button
                className="primary-button btn-standard"
                type="button"
                onClick={onApprove}
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <CheckCircle style={{ width: 16, height: 16 }} />
                Phê duyệt
              </button>
            )}

            {bom.status === 'approved' && (
              <>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={onRevise}
                  disabled={isSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <GitMerge style={{ width: 16, height: 16 }} />
                  Tạo Revision
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={onDeprecate}
                  disabled={isSaving}
                  style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <FileX style={{ width: 16, height: 16 }} />
                  Báo phế
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div style={{ padding: '1.25rem' }}>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div className="form-field">
            <label>Tên công thức</label>
            <p style={{ fontWeight: 600, margin: 0 }}>{bom.name}</p>
          </div>
          <div className="form-field">
            <label>Sản phẩm mộc</label>
            <p style={{ fontWeight: 600, margin: 0 }}>
              {bom.fabric_catalogs?.code} — {bom.fabric_catalogs?.name ?? 'N/A'}
            </p>
          </div>
          <div className="form-field">
            <label>Quy cách (Width / GSM)</label>
            <p style={{ margin: 0 }}>
              {bom.target_width_cm ? `${bom.target_width_cm} cm` : '—'} / {bom.target_gsm ? `${bom.target_gsm} gsm` : '—'}
            </p>
          </div>
          <div className="form-field">
            <label>Hao hụt mặc định</label>
            <p style={{ margin: 0, fontWeight: 700 }}>{bom.standard_loss_pct}%</p>
          </div>
          <div className="form-field">
            <label>Phiên bản</label>
            <p style={{ margin: 0 }}>v{bom.active_version}</p>
          </div>
        </div>

        {bom.notes && (
          <p style={{ marginTop: '1rem', fontStyle: 'italic', color: 'var(--muted)', fontSize: '0.88rem' }}>
            {bom.notes}
          </p>
        )}
      </div>

      {/* Yarn Items Table */}
      <div style={{ padding: '0 1.25rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
          Thành phần nguyên liệu (v{bom.active_version})
        </p>
      </div>
      <div className="data-table-wrap card-table-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Loại Sợi</th>
              <th className="hide-mobile">Thành phần</th>
              <th className="text-right">Tỉ lệ (%)</th>
              <th className="text-right">Tiêu hao (kg/m)</th>
            </tr>
          </thead>
          <tbody>
            {bom.bom_yarn_items?.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.yarn_catalogs?.code}</strong>
                  <div className="td-muted" style={{ fontSize: '0.8rem' }}>
                    {item.yarn_catalogs?.name}
                  </div>
                </td>
                <td className="hide-mobile td-muted">
                  {item.yarn_catalogs?.composition || '—'}
                </td>
                <td className="text-right" style={{ fontWeight: 700 }}>
                  {item.ratio_pct}%
                </td>
                <td className="text-right td-muted">
                  {item.consumption_kg_per_m} kg/m
                </td>
              </tr>
            ))}
            {(!bom.bom_yarn_items || bom.bom_yarn_items.length === 0) && (
              <tr>
                <td colSpan={4}>
                  <div className="table-empty" style={{ padding: '2rem' }}>
                    Chưa có dữ liệu nguyên liệu
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Version History */}
      <div style={{ padding: '1.25rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Lịch sử phiên bản</p>
        {versions.length === 0 ? (
          <p className="td-muted" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
            Chưa có lịch sử (chưa từng được duyệt).
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {versions.map((ver) => (
              <div
                key={ver.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  className="roll-status in_stock"
                  style={{ flexShrink: 0, fontSize: '0.7rem' }}
                >
                  v{ver.version}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                    {ver.change_reason || 'Phê duyệt ban đầu'}
                  </p>
                  <p className="td-muted" style={{ margin: 0, fontSize: '0.78rem', marginTop: '0.2rem' }}>
                    {ver.created_by_profile?.full_name ?? 'N/A'} •{' '}
                    {new Date(ver.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
