import { BOM_STATUS_LABELS } from './bom.module'
import { BomTemplate, BomStatus } from './types'

interface BomListProps {
  boms: BomTemplate[]
  onSelect: (bom: BomTemplate) => void
  onEdit: (bom: BomTemplate) => void
  onDeprecate: (bom: BomTemplate) => void
}

export function BomList({ boms, onSelect, onEdit, onDeprecate }: BomListProps) {
  if (boms.length === 0) {
    return (
      <div className="table-empty">
        <p>Chưa có công thức định mức (BOM) nào.</p>
      </div>
    )
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Mã BOM</th>
          <th>Tên Công Thức</th>
          <th className="hide-mobile">Sản Phẩm Mục Tiêu</th>
          <th className="hide-mobile">Phiên Bản</th>
          <th>Trạng Thái</th>
          <th className="hide-mobile">Người Tạo</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {boms.map((bom) => {
          const statusLabel = BOM_STATUS_LABELS[bom.status as BomStatus] || bom.status

          return (
            <tr
              key={bom.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(bom)}
            >
              <td>
                <strong>{bom.code}</strong>
                <div className="td-muted" style={{ fontSize: '0.8rem' }}>
                  {bom.name}
                </div>
              </td>
              <td className="hide-mobile">{bom.name}</td>
              <td className="hide-mobile td-muted">
                {bom.fabric_catalogs?.name || '---'}
                {bom.target_width_cm ? ` (${bom.target_width_cm}cm)` : ''}
              </td>
              <td className="hide-mobile">
                v{bom.active_version}
              </td>
              <td>
                <span className={`roll-status ${bom.status}`}>
                  {statusLabel}
                </span>
              </td>
              <td className="hide-mobile td-muted">
                {bom.created_by_profile?.full_name || 'N/A'}
              </td>
              <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                {bom.status === 'draft' && (
                  <button
                    className="btn-icon"
                    type="button"
                    title="Sửa bản nháp"
                    onClick={() => onEdit(bom)}
                    style={{ marginRight: 4 }}
                  >
                    ✏️
                  </button>
                )}
                {bom.status === 'approved' && (
                  <button
                    className="btn-icon danger"
                    type="button"
                    title="Báo phế"
                    onClick={() => onDeprecate(bom)}
                  >
                    ⚠️
                  </button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
