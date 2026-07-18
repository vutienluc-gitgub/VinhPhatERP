import { cn } from '@/shared/utils/cn';
import type {
  FabricCatalog,
  FabricVariant,
} from '@/domain/settings/fabric-catalog.types';
import {
  PUBLIC_PAGE_LABELS as LABELS,
  PUBLIC_COMPONENT_LABELS as COMP_LABELS,
  STRETCH_TYPE_MAP,
  THICKNESS_MAP,
} from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricSpecsListProps {
  fabric: Partial<FabricCatalog>;
  displayMOQ: string;
  displayLeadTime: string;
  displayYieldMetersPerKg?: string | null;
  canViewInventory: boolean;
  activeVariant: FabricVariant | undefined;
}

function SpecItem({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span className="text-xs text-muted mb-0.5">{label}</span>
      <span className="font-semibold text-gray-800 text-sm">{value}</span>
    </div>
  );
}

export function FabricSpecsList({
  fabric,
  displayMOQ,
  displayLeadTime,
  displayYieldMetersPerKg,
  canViewInventory,
  activeVariant,
}: FabricSpecsListProps) {
  return (
    <>
      {/* Technical Specifications */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
          {LABELS.specs}
        </h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          {fabric.fabric_type && (
            <SpecItem
              label={LABELS.fabricType}
              value={
                fabric.fabric_type === 'knitted' ? LABELS.knitted : LABELS.woven
              }
            />
          )}

          {fabric.composition && (
            <SpecItem label={LABELS.composition} value={fabric.composition} />
          )}

          {fabric.target_width_cm && (
            <SpecItem
              label={LABELS.width}
              value={`${fabric.target_width_cm} ${LABELS.unitCm}`}
            />
          )}

          {fabric.target_gsm && (
            <SpecItem
              label={LABELS.gsm}
              value={`${fabric.target_gsm} ${LABELS.unitGsm}`}
            />
          )}

          {displayYieldMetersPerKg && (
            <SpecItem
              label={LABELS.yieldMetersPerKg}
              value={`~${displayYieldMetersPerKg}`}
            />
          )}

          {fabric.stretch_type && STRETCH_TYPE_MAP[fabric.stretch_type] && (
            <SpecItem
              label={LABELS.stretch}
              value={STRETCH_TYPE_MAP[fabric.stretch_type]}
            />
          )}

          {fabric.thickness && THICKNESS_MAP[fabric.thickness] && (
            <SpecItem
              label={LABELS.thickness}
              value={THICKNESS_MAP[fabric.thickness]}
            />
          )}

          {fabric.weave_pattern && (
            <SpecItem
              label={LABELS.weavePattern}
              value={fabric.weave_pattern}
            />
          )}

          {fabric.technique && (
            <SpecItem label={LABELS.machineType} value={fabric.technique} />
          )}
        </div>
      </div>

      {/* Commercial Specifications (MOQ & Lead times) */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
          {LABELS.specsCommercial}
        </h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          <SpecItem
            label={LABELS.moq}
            value={<span className="font-bold">{displayMOQ}</span>}
          />

          <SpecItem
            label={LABELS.leadTime}
            value={<span className="font-bold">{displayLeadTime}</span>}
          />

          {fabric.commercial?.origin_country && (
            <SpecItem
              className="col-span-2"
              label={LABELS.origin}
              value={fabric.commercial.origin_country}
            />
          )}

          {canViewInventory && activeVariant && activeVariant.stock_status && (
            <div className="flex flex-col col-span-2 mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-muted mb-0.5">
                {COMP_LABELS.INVENTORY_STATUS_TITLE.replace(
                  '{color}',
                  activeVariant.color_name,
                )}
              </span>
              <span
                className={cn(
                  'font-bold text-sm',
                  activeVariant.stock_status === 'in-stock'
                    ? 'text-green-600'
                    : 'text-red-500',
                )}
              >
                {activeVariant.stock_status === 'in-stock' &&
                activeVariant.available_kg != null
                  ? LABELS.stockAvailableDetail
                      .replace('{qty}', String(activeVariant.available_kg))
                      .replace('{unit}', fabric.unit || 'kg')
                      .replace('{rolls}', String(activeVariant.roll_count || 0))
                  : activeVariant.stock_status === 'in-stock'
                    ? COMP_LABELS.IN_STOCK
                    : COMP_LABELS.OUT_OF_STOCK}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
