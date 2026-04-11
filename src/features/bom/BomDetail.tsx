import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components/Badge';

import { BOM_STATUS_LABELS } from './bom.module';
import { BomTemplate, BomStatus } from './types';
import { useBomVersions } from './useBom';

interface BomDetailProps {
  bom: BomTemplate;
  onBack: () => void;
  onApprove: () => void;
  onDeprecate: () => void;
  onRevise: () => void;
  isSaving: boolean;
}

function getStatusVariant(status: BomStatus) {
  switch (status) {
    case 'approved':
      return 'success';
    case 'deprecated':
      return 'danger';
    default:
      return 'gray';
  }
}

export function BomDetail({
  bom,
  onBack,
  onApprove,
  onDeprecate,
  onRevise,
  isSaving,
}: BomDetailProps) {
  const { data: versions = [] } = useBomVersions(bom.id);
  const statusLabel = BOM_STATUS_LABELS[bom.status as BomStatus] || bom.status;

  return (
    <div className="panel-card card-flush">
      {/* Header */}
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
            <p className="eyebrow-premium">CHI TIET DINH MUC</p>
            <h3 className="title-premium flex items-center gap-3">
              {bom.code}
              <Badge variant={getStatusVariant(bom.status as BomStatus)}>
                {statusLabel}
              </Badge>
            </h3>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {bom.status === 'draft' && (
            <button
              className="btn-primary flex items-center gap-2"
              type="button"
              onClick={onApprove}
              disabled={isSaving}
            >
              <Icon name="CheckCircle" size={16} />
              Phe duyet
            </button>
          )}

          {bom.status === 'approved' && (
            <>
              <button
                className="btn-secondary flex items-center gap-2"
                type="button"
                onClick={onRevise}
                disabled={isSaving}
              >
                <Icon name="GitMerge" size={16} />
                Tao Revision
              </button>
              <button
                className="btn-secondary text-danger border-danger/20 flex items-center gap-2"
                type="button"
                onClick={onDeprecate}
                disabled={isSaving}
              >
                <Icon name="FileX" size={16} />
                Bao phe
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="form-field">
            <label>Ten cong thuc</label>
            <p className="font-bold">{bom.name}</p>
          </div>
          <div className="form-field">
            <label>San pham moc</label>
            <p className="font-bold">
              {bom.fabric_catalogs?.code} — {bom.fabric_catalogs?.name ?? 'N/A'}
            </p>
          </div>
          <div className="form-field">
            <label>Quy cach (Width / GSM)</label>
            <p>
              {bom.target_width_cm ? `${bom.target_width_cm} cm` : '—'} /{' '}
              {bom.target_gsm ? `${bom.target_gsm} gsm` : '—'}
            </p>
          </div>
          <div className="form-field">
            <label>Hao hut mac dinh</label>
            <p className="font-bold text-primary">{bom.standard_loss_pct}%</p>
          </div>
          <div className="form-field">
            <label>Phien ban</label>
            <p>v{bom.active_version}</p>
          </div>
        </div>

        {bom.notes && (
          <p className="mt-4 text-sm italic text-muted">{bom.notes}</p>
        )}
      </div>

      {/* Yarn Items Table */}
      <div className="px-5 pb-2">
        <p className="eyebrow-premium">
          Thanh phan nguyen lieu (v{bom.active_version})
        </p>
      </div>
      <div className="card-table-section">
        <table className="data-table">
          <thead>
            <tr>
              <th>Loai Soi</th>
              <th className="hide-mobile">Thanh phan</th>
              <th className="text-right">Ti le (%)</th>
              <th className="text-right">Tieu hao (kg/m)</th>
            </tr>
          </thead>
          <tbody>
            {bom.bom_yarn_items?.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.yarn_catalogs?.code}</strong>
                  <div className="td-muted text-xs">
                    {item.yarn_catalogs?.name}
                  </div>
                </td>
                <td className="hide-mobile td-muted">
                  {item.yarn_catalogs?.composition || '—'}
                </td>
                <td className="text-right font-bold">{item.ratio_pct}%</td>
                <td className="text-right td-muted">
                  {item.consumption_kg_per_m} kg/m
                </td>
              </tr>
            ))}
            {(!bom.bom_yarn_items || bom.bom_yarn_items.length === 0) && (
              <tr>
                <td colSpan={4}>
                  <div className="py-8 text-center text-sm text-muted">
                    Chua co du lieu nguyen lieu
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Version History */}
      <div className="p-5">
        <p className="eyebrow-premium mb-3">Lich su phien ban</p>
        {versions.length === 0 ? (
          <p className="td-muted text-sm italic">
            Chua co lich su (chua tung duoc duyet).
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="flex gap-3 p-3 border border-border rounded-lg items-start"
              >
                <Badge variant="info">v{ver.version}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">
                    {ver.change_reason || 'Phe duyet ban dau'}
                  </p>
                  <p className="td-muted text-xs mt-0.5">
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
  );
}
