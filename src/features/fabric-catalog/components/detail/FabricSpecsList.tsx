import { cn } from '@/shared/utils/cn';
import type {
  FabricCatalog,
  FabricVariant,
} from '@/domain/settings/fabric-catalog.types';
import {
  PUBLIC_PAGE_LABELS as LABELS,
  STRETCH_TYPE_MAP,
  THICKNESS_MAP,
} from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricSpecsListProps {
  fabric: Partial<FabricCatalog>;
  displayMOQ: string;
  displayLeadTime: string;
  canViewInventory: boolean;
  activeVariant: FabricVariant | undefined;
}

export function FabricSpecsList({
  fabric,
  displayMOQ,
  displayLeadTime,
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
            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">
                {LABELS.fabricType}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {fabric.fabric_type === 'knitted'
                  ? LABELS.knitted
                  : LABELS.woven}
              </span>
            </div>
          )}

          {fabric.composition && (
            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">
                {LABELS.composition}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {fabric.composition}
              </span>
            </div>
          )}

          {fabric.target_width_cm && (
            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">{LABELS.width}</span>
              <span className="font-semibold text-gray-800 text-sm">
                {fabric.target_width_cm} {LABELS.unitCm}
              </span>
            </div>
          )}

          {fabric.target_gsm && (
            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">{LABELS.gsm}</span>
              <span className="font-semibold text-gray-800 text-sm">
                {fabric.target_gsm} {LABELS.unitGsm}
              </span>
            </div>
          )}

          {fabric.stretch_type && STRETCH_TYPE_MAP[fabric.stretch_type] && (
            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">
                {LABELS.stretch}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {STRETCH_TYPE_MAP[fabric.stretch_type]}
              </span>
            </div>
          )}

          {fabric.thickness && THICKNESS_MAP[fabric.thickness] && (
            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">
                {LABELS.thickness}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {THICKNESS_MAP[fabric.thickness]}
              </span>
            </div>
          )}

          {fabric.weave_pattern && (
            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">
                {LABELS.weavePattern}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {fabric.weave_pattern}
              </span>
            </div>
          )}

          {fabric.technique && (
            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">
                {LABELS.machineType}
              </span>
              <span className="font-semibold text-gray-800 text-sm">
                {fabric.technique}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Commercial Specifications (MOQ & Lead times) */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
          {LABELS.specsCommercial}
        </h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted mb-0.5">{LABELS.moq}</span>
            <span className="font-bold text-gray-800 text-sm">
              {displayMOQ}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-muted mb-0.5">{LABELS.leadTime}</span>
            <span className="font-bold text-gray-800 text-sm">
              {displayLeadTime}
            </span>
          </div>

          {fabric.commercial?.origin_country && (
            <div className="flex flex-col col-span-2">
              <span className="text-xs text-muted mb-0.5">{LABELS.origin}</span>
              <span className="font-semibold text-gray-800 text-sm">
                {fabric.commercial.origin_country}
              </span>
            </div>
          )}

          {canViewInventory && activeVariant && activeVariant.stock_status && (
            <div className="flex flex-col col-span-2 mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-muted mb-0.5">
                Trạng thái kho ({activeVariant.color_name})
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
                    ? 'Sẵn có'
                    : 'Hết hàng'}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
