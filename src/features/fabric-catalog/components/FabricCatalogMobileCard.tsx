import { Icon } from '@/shared/components/Icon';
import { Badge } from '@/shared/components';
import { FABRIC_CATALOG_STATUS_LABELS } from '@/schema/fabric-catalog.schema';
import type { FabricCatalog } from '@/features/fabric-catalog/types';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import {
  getStatusVariant,
  formatCompositionParts,
} from '@/features/fabric-catalog/fabric-catalog.helpers';

interface FabricCatalogMobileCardProps {
  catalog: FabricCatalog;
  onEdit: (catalog: FabricCatalog) => void;
  onDelete: (catalog: FabricCatalog) => void;
  onShowQR?: () => void;
  isDeleting: boolean;
}

export function FabricCatalogMobileCard({
  catalog: c,
  onEdit,
  onDelete,
  onShowQR,
  isDeleting,
}: FabricCatalogMobileCardProps) {
  return (
    <div className="mobile-card">
      {c.image_url && (
        <img
          src={c.image_url}
          alt={c.name}
          className="w-full h-32 object-cover rounded-t-lg max-w-none pointer-events-none select-none"
          style={{
            margin: '-1.25rem -1.25rem 0.75rem',
            width: 'calc(100% + 2.5rem)',
          }}
          loading="lazy"
          draggable={false}
        />
      )}
      <div className="mobile-card-header">
        <span className="mobile-card-title">{c.code}</span>
        <Badge variant={getStatusVariant(c.status)}>
          {FABRIC_CATALOG_STATUS_LABELS[c.status]}
        </Badge>
      </div>
      <div className="mobile-card-body space-y-2">
        <p className="font-bold text-sm">{c.name}</p>
        <p className="text-xs text-muted-foreground italic">
          {formatCompositionParts(c.composition_parts, c.composition) ||
            LABELS.NA}
        </p>
        {(c.target_width_cm || c.target_gsm) && (
          <div className="text-xs text-muted-foreground bg-surface p-2 rounded border border-border">
            {c.target_width_cm && (
              <div>
                {LABELS.WIDTH}:{' '}
                <span className="font-medium">{c.target_width_cm} cm</span>
              </div>
            )}
            {c.target_gsm && (
              <div>
                {LABELS.GSM}:{' '}
                <span className="font-medium">{c.target_gsm} gsm</span>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/10">
          <span>
            {LABELS.UNIT}: {c.unit}
          </span>
          <div className="flex gap-2">
            <button
              className="btn-icon p-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(c);
              }}
            >
              <Icon name="Pencil" size={16} />
            </button>
            {onShowQR && (
              <button
                className="btn-icon p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowQR();
                }}
                title={LABELS.PRINT_QR}
              >
                <Icon name="QrCode" size={16} />
              </button>
            )}
            <button
              className="btn-icon p-1 text-danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c);
              }}
              disabled={isDeleting}
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
