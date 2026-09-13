import type {
  LatestYarnPriceResult,
  OpenPurchaseOrderOption,
  YarnSlipScanResponse,
} from '@/api/yarn-receipts.api';
import { ScanPricePoSection } from '@/features/yarn-receipts/components/scan/ScanPricePoSection';
import type { YarnCatalogMatchResult } from '@/features/yarn-receipts/utils/yarn-slip-prefill';
import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import { Icon } from '@/shared/components/Icon';
import { formatQuantity } from '@/shared/utils/format';

export interface ScanAuditDetailsProps {
  scanResponse: YarnSlipScanResponse;
  visible?: boolean;
  catalogMatch?: YarnCatalogMatchResult | null;
  breakdownByPackages?: boolean;
  onToggleBreakdown?: (val: boolean) => void;
  unitPrice?: number;
  onPriceChange?: (price: number) => void;
  selectedPoId?: string;
  onSelectPo?: (poId: string) => void;
  openPos?: OpenPurchaseOrderOption[];
  latestPrice?: LatestYarnPriceResult | null;
  isLoadingPrice?: boolean;
}

export function ScanAuditDetails({
  scanResponse,
  visible = true,
  catalogMatch,
  breakdownByPackages = false,
  onToggleBreakdown,
  unitPrice = 0,
  onPriceChange,
  selectedPoId,
  onSelectPo,
  openPos,
  latestPrice,
  isLoadingPrice = false,
}: ScanAuditDetailsProps) {
  const {
    suggested_receipt: suggested,
    extraction,
    supplier_match: supplierMatch,
  } = scanResponse;

  return (
    <div className={`space-y-4 ${visible ? 'block' : 'hidden md:block'}`}>
      {/* 1. Header Information */}
      <div className="rounded-lg border border-default bg-surface p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
            {SCAN_WORKSPACE_LABELS.SECTION_HEADER_INFO}
          </h4>
          {supplierMatch.matchedSupplierName && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-success-soft text-success font-medium">
              {SCAN_WORKSPACE_LABELS.supplierConfidenceBadge(
                Math.round(supplierMatch.confidence * 100),
              )}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted block">
              {SCAN_WORKSPACE_LABELS.FIELD_DOC_NUMBER}
            </span>
            <span className="font-semibold text-foreground">
              {suggested.receipt_number || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted block">
              {SCAN_WORKSPACE_LABELS.FIELD_DOC_DATE}
            </span>
            <span className="font-semibold text-foreground">
              {suggested.receipt_date || '—'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-muted block">
              {SCAN_WORKSPACE_LABELS.FIELD_SUPPLIER}
            </span>
            <span className="font-semibold text-foreground">
              {suggested.supplier_name || supplierMatch.rawName || '—'}
            </span>
          </div>
          {suggested.vehicle_info && (
            <div className="col-span-2">
              <span className="text-muted block">
                {SCAN_WORKSPACE_LABELS.FIELD_VEHICLE}
              </span>
              <span className="text-foreground">{suggested.vehicle_info}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Weight & Summary Inspection */}
      <div className="rounded-lg border border-default bg-surface p-3.5 space-y-3">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {SCAN_WORKSPACE_LABELS.SECTION_WEIGHT_SUMMARY}
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted block">
              {SCAN_WORKSPACE_LABELS.FIELD_YARN_TYPE}
            </span>
            <span className="font-semibold text-foreground">
              {suggested.yarn_type || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted block">
              {SCAN_WORKSPACE_LABELS.FIELD_LOT}
            </span>
            <span className="font-semibold text-foreground">
              {suggested.yarn_lot || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted block">
              {SCAN_WORKSPACE_LABELS.FIELD_PACKAGE_COUNT}
            </span>
            <span className="font-semibold text-foreground">
              {suggested.package_count ?? '—'}
            </span>
          </div>

          {/* Catalog Match Info */}
          <div className="col-span-2 sm:col-span-3 p-2 rounded bg-surface-secondary border border-default flex items-center justify-between gap-2">
            <div>
              <span className="text-muted block text-[11px]">
                {SCAN_WORKSPACE_LABELS.FIELD_CATALOG_MATCH}
              </span>
              <span className="font-semibold text-foreground text-xs">
                {catalogMatch?.matchedCatalogName
                  ? `${catalogMatch.matchedCatalogCode} - ${catalogMatch.matchedCatalogName}`
                  : SCAN_WORKSPACE_LABELS.STATUS_CATALOG_UNMATCHED}
              </span>
            </div>
            {catalogMatch?.matchedCatalogName && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-info-soft text-info font-medium shrink-0">
                {SCAN_WORKSPACE_LABELS.catalogConfidenceBadge(
                  Math.round(catalogMatch.confidence * 100),
                )}
              </span>
            )}
          </div>

          <div className="p-2 rounded bg-surface-secondary border border-default">
            <span className="text-muted block">
              {SCAN_WORKSPACE_LABELS.FIELD_GROSS_WEIGHT}
            </span>
            <span className="font-bold text-foreground text-sm">
              {suggested.gross_weight_kg != null
                ? `${formatQuantity(suggested.gross_weight_kg)} kg`
                : '—'}
            </span>
          </div>
          <div className="p-2 rounded bg-surface-secondary border border-default">
            <span className="text-muted block">
              {SCAN_WORKSPACE_LABELS.FIELD_TARE_WEIGHT}
            </span>
            <span className="font-bold text-foreground text-sm">
              {suggested.tare_weight_kg != null
                ? `${formatQuantity(suggested.tare_weight_kg)} kg`
                : '—'}
            </span>
          </div>
          <div className="p-2 rounded bg-success-soft/40 border border-success/30">
            <span className="text-success block font-medium">
              {SCAN_WORKSPACE_LABELS.FIELD_NET_WEIGHT}
            </span>
            <span className="font-bold text-success text-sm">
              {suggested.declared_net_weight_kg != null
                ? `${formatQuantity(suggested.declared_net_weight_kg)} kg`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Unit Price & PO Linkage (Gap #2) */}
      {onPriceChange && (
        <ScanPricePoSection
          unitPrice={unitPrice}
          onPriceChange={onPriceChange}
          selectedPoId={selectedPoId}
          onSelectPo={onSelectPo}
          openPos={openPos}
          latestPrice={latestPrice}
          isLoadingPrice={isLoadingPrice}
          netWeightKg={suggested.declared_net_weight_kg}
        />
      )}

      {/* 4. Mathematical Discrepancies Alert */}
      {extraction.math_discrepancies.length > 0 && (
        <div className="rounded-lg border border-danger bg-danger-soft p-3.5 space-y-2 text-xs text-danger">
          <h4 className="font-semibold uppercase tracking-wide flex items-center gap-1.5">
            <Icon name="AlertOctagon" size={14} />
            {SCAN_WORKSPACE_LABELS.SECTION_DISCREPANCIES}
          </h4>
          <ul className="space-y-1.5 list-disc list-inside">
            {extraction.math_discrepancies.map((disc, idx) => (
              <li key={idx} className="leading-relaxed">
                <span className="font-semibold">{disc.rule_name}:</span>{' '}
                {disc.message_vi} (
                {SCAN_WORKSPACE_LABELS.discrepancyDetail(
                  disc.actual,
                  disc.expected,
                  disc.diff,
                )}
                )
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Packages Table (if multi-package) */}
      {extraction.packages.length > 0 && (
        <div className="rounded-lg border border-default bg-surface p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
              {SCAN_WORKSPACE_LABELS.SECTION_PACKAGES_TABLE} (
              {extraction.packages.length})
            </h4>
            {onToggleBreakdown && (
              <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={breakdownByPackages}
                  onChange={(e) => onToggleBreakdown(e.target.checked)}
                  className="rounded border-default text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="text-foreground font-medium text-[11px]">
                  {SCAN_WORKSPACE_LABELS.SWITCH_BREAKDOWN_PACKAGES}
                </span>
              </label>
            )}
          </div>
          <div className="overflow-x-auto max-h-40 border border-default rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-secondary text-muted uppercase text-[10px]">
                <tr>
                  <th className="p-1.5">{SCAN_WORKSPACE_LABELS.COL_INDEX}</th>
                  <th className="p-1.5">
                    {SCAN_WORKSPACE_LABELS.COL_PACKAGE_CODE}
                  </th>
                  <th className="p-1.5 text-right">
                    {SCAN_WORKSPACE_LABELS.COL_GROSS}
                  </th>
                  <th className="p-1.5 text-right">
                    {SCAN_WORKSPACE_LABELS.COL_TARE}
                  </th>
                  <th className="p-1.5 text-right">
                    {SCAN_WORKSPACE_LABELS.COL_NET}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {extraction.packages.slice(0, 15).map((pkg) => (
                  <tr
                    key={pkg.package_index}
                    className="hover:bg-surface-secondary/40"
                  >
                    <td className="p-1.5 font-mono">{pkg.package_index}</td>
                    <td className="p-1.5 text-muted">
                      {pkg.package_code || '—'}
                    </td>
                    <td className="p-1.5 text-right">{pkg.gross_kg ?? '—'}</td>
                    <td className="p-1.5 text-right">{pkg.tare_kg ?? '—'}</td>
                    <td className="p-1.5 text-right font-semibold text-foreground">
                      {pkg.net_kg}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
