import type { LatestYarnPriceResult } from '@/api/yarn-receipts.api';
import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import { Icon } from '@/shared/components/Icon';
import { VPSelect, type VPOption } from '@/shared/components/VPSelect';
import { MoneyInput, MoneyText } from '@/shared/value';
import type { OpenPurchaseOrderOption } from '@/api/yarn-receipts.api';

export interface ScanPricePoSectionProps {
  unitPrice: number;
  onPriceChange: (price: number) => void;
  selectedPoId?: string;
  onSelectPo?: (poId: string) => void;
  openPos?: OpenPurchaseOrderOption[];
  latestPrice?: LatestYarnPriceResult | null;
  isLoadingPrice?: boolean;
  netWeightKg?: number | null;
}

export function ScanPricePoSection({
  unitPrice,
  onPriceChange,
  selectedPoId = '',
  onSelectPo,
  openPos = [],
  latestPrice,
  isLoadingPrice = false,
  netWeightKg = 0,
}: ScanPricePoSectionProps) {
  const poOptions: VPOption<string>[] = [
    { value: '', label: SCAN_WORKSPACE_LABELS.OPT_NO_PO },
    ...openPos.map((po) => ({
      value: po.id,
      label: `${po.poCode} (${po.status}) - ${po.orderDate}`,
    })),
  ];

  const totalEstimated = Math.round((netWeightKg || 0) * (unitPrice || 0));

  return (
    <div className="rounded-lg border border-default bg-surface p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Icon name="DollarSign" size={14} className="text-primary" />
          {SCAN_WORKSPACE_LABELS.SECTION_PRICE_PO}
        </h4>
        {isLoadingPrice && (
          <span className="text-[11px] text-muted animate-pulse">
            {SCAN_WORKSPACE_LABELS.HINT_LOOKING_UP_PRICE}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* 1. Unit Price Input */}
        <div className="space-y-1">
          <label
            htmlFor="scan-unit-price-input"
            className="text-muted block font-medium"
          >
            {SCAN_WORKSPACE_LABELS.FIELD_UNIT_PRICE}
          </label>
          <MoneyInput
            id="scan-unit-price-input"
            value={unitPrice}
            onChange={(val) => onPriceChange(Number(val) || 0)}
            className="h-8 text-xs font-semibold"
            placeholder="0"
          />

          {/* Price History / Hint */}
          {latestPrice && latestPrice.unitPrice > 0 ? (
            <div className="flex items-center justify-between gap-1.5 pt-1 text-[11px] text-muted">
              <span className="truncate">
                {SCAN_WORKSPACE_LABELS.HINT_LATEST_PRICE}:{' '}
                <strong className="text-foreground">
                  <MoneyText value={latestPrice.unitPrice} />
                  /kg
                </strong>{' '}
                {latestPrice.receiptNumber && (
                  <span className="text-muted">
                    {SCAN_WORKSPACE_LABELS.latestPriceDocBadge(
                      latestPrice.receiptNumber,
                      latestPrice.receiptDate,
                    )}
                  </span>
                )}
              </span>
              {unitPrice !== latestPrice.unitPrice && (
                <button
                  type="button"
                  onClick={() => onPriceChange(latestPrice.unitPrice)}
                  className="text-primary hover:underline font-medium shrink-0 cursor-pointer"
                >
                  {SCAN_WORKSPACE_LABELS.BTN_APPLY_PRICE}
                </button>
              )}
            </div>
          ) : (
            !isLoadingPrice && (
              <span className="text-[11px] text-muted italic block pt-0.5">
                {SCAN_WORKSPACE_LABELS.STATUS_NO_PRICE_HISTORY}
              </span>
            )
          )}
        </div>

        {/* 2. Open Purchase Order Selector */}
        <div className="space-y-1">
          <label className="text-muted block font-medium">
            {SCAN_WORKSPACE_LABELS.FIELD_LINK_PO}
          </label>
          {onSelectPo ? (
            <VPSelect<string>
              options={poOptions}
              value={selectedPoId}
              onValueChange={onSelectPo}
              size="sm"
              placeholder={SCAN_WORKSPACE_LABELS.OPT_NO_PO}
            />
          ) : (
            <span className="text-muted block text-xs">
              {SCAN_WORKSPACE_LABELS.OPT_NO_PO}
            </span>
          )}
        </div>
      </div>

      {/* 3. Estimated Total Value */}
      {totalEstimated > 0 && (
        <div className="pt-2 border-t border-default flex items-center justify-between text-xs">
          <span className="text-muted font-medium">
            {SCAN_WORKSPACE_LABELS.ESTIMATED_TOTAL_AMOUNT}:
          </span>
          <span className="text-sm font-bold text-success">
            <MoneyText value={totalEstimated} />
          </span>
        </div>
      )}
    </div>
  );
}
