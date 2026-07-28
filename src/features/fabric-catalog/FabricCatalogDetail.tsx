import { Badge, Icon } from '@/shared/components';
import { FABRIC_CATALOG_STATUS_LABELS } from '@/schema/fabric-catalog.schema';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';

import { FabricVariantList } from './FabricVariantList';
import { FabricCategoryBadge } from './components/FabricCategoryBadge';
import {
  getStatusVariant,
  formatCompositionParts,
} from './fabric-catalog.helpers';

type FabricCatalogDetailProps = {
  catalog: FabricCatalog;
};

export function FabricCatalogDetail({ catalog }: FabricCatalogDetailProps) {
  return (
    <div className="panel-card card-flush">
      {/* Master Info */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start gap-4">
          {/* Image */}
          {catalog.image_url ? (
            <img
              src={catalog.image_url}
              alt={catalog.name}
              className="w-20 h-20 rounded-lg object-cover border border-border shrink-0"
              loading="lazy"
              draggable={false}
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-surface-subtle flex items-center justify-center border border-border shrink-0">
              <Icon name="Image" size={24} className="text-muted" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-primary">{catalog.code}</h2>
              <Badge variant={getStatusVariant(catalog.status)}>
                {FABRIC_CATALOG_STATUS_LABELS[catalog.status]}
              </Badge>
            </div>
            <p className="font-semibold text-base mt-0.5">{catalog.name}</p>
            {catalog.category && (
              <div className="mt-1">
                <FabricCategoryBadge category={catalog.category} />
              </div>
            )}
            {formatCompositionParts(
              catalog.composition_parts,
              catalog.composition,
            ) && (
              <p className="text-sm">
                {formatCompositionParts(
                  catalog.composition_parts,
                  catalog.composition,
                )}
              </p>
            )}

            {/* Specs */}
            <div className="flex flex-wrap gap-4 mt-3">
              {catalog.target_width_cm !== null && (
                <div className="text-sm">
                  <span className="text-muted">{LABELS.TARGET_WIDTH} </span>
                  <span className="font-semibold">
                    {catalog.target_width_cm} cm
                  </span>
                </div>
              )}
              {catalog.target_gsm !== null && (
                <div className="text-sm">
                  <span className="text-muted">{LABELS.TARGET_GSM} </span>
                  <span className="font-semibold">
                    {catalog.target_gsm} gsm
                  </span>
                </div>
              )}
              <div className="text-sm">
                <span className="text-muted">{LABELS.UNIT}: </span>
                <span className="font-semibold">{catalog.unit}</span>
              </div>
            </div>

            {catalog.notes && (
              <p className="text-xs text-muted mt-2 bg-surface-subtle p-2 rounded border-l-2 border-primary/20 italic">
                {catalog.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Variants Section */}
      <FabricVariantList
        fabricCatalogId={catalog.id}
        parentCode={catalog.code}
      />
    </div>
  );
}
