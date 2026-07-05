import { useMemo } from 'react';

import { Button, Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import type {
  FabricCatalog,
  FabricPricingTier,
} from '@/domain/settings/fabric-catalog.types';
import {
  PUBLIC_PAGE_LABELS,
  LABELS,
} from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricPricingTableProps {
  fabric: Partial<FabricCatalog>;
  pricingTiers: FabricPricingTier[] | undefined;
  canViewWholesale: boolean;
  onOpenLogin: () => void;
}

export function FabricPricingTable({
  fabric,
  pricingTiers,
  canViewWholesale,
  onOpenLogin,
}: FabricPricingTableProps) {
  const sortedTiers = useMemo(() => {
    if (!pricingTiers) return [];
    return [...pricingTiers].sort((a, b) => a.min_quantity - b.min_quantity);
  }, [pricingTiers]);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-end mb-3">
        <h4 className="text-sm font-semibold text-gray-800">
          {PUBLIC_PAGE_LABELS.pricingTierTitle}
        </h4>
        {!canViewWholesale && (
          <button
            onClick={onOpenLogin}
            className="text-xs text-primary font-semibold hover:underline"
          >
            {PUBLIC_PAGE_LABELS.loginToViewPrice}
          </button>
        )}
      </div>
      {sortedTiers.length > 0 ? (
        <div className="overflow-hidden border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="p-3">{PUBLIC_PAGE_LABELS.pricingTierColQty}</th>
                <th className="p-3 text-right">
                  {PUBLIC_PAGE_LABELS.pricingTierColPrice}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedTiers.map((tier) => {
                const rangeLabel = tier.max_quantity
                  ? PUBLIC_PAGE_LABELS.fromTo
                      .replace('{min}', String(tier.min_quantity))
                      .replace('{max}', String(tier.max_quantity))
                  : PUBLIC_PAGE_LABELS.from.replace(
                      '{min}',
                      String(tier.min_quantity),
                    );

                const buyLabel = PUBLIC_PAGE_LABELS.buyQty
                  .replace('{range}', rangeLabel)
                  .replace('{unit}', fabric.unit || LABELS.PREVIEW_UNIT_KG);

                return (
                  <tr key={tier.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-medium">{buyLabel}</td>
                    <td className="p-3 text-right font-semibold text-primary">
                      {tier.display_label ? (
                        tier.display_label
                      ) : (
                        <MoneyText
                          value={tier.unit_price}
                          suffix={tier.currency === 'USD' ? ' USD' : ' đ'}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : canViewWholesale ? (
        <div className="p-4 rounded-xl bg-slate-50 text-center border border-dashed border-slate-200">
          <p className="text-xs text-muted">
            {PUBLIC_PAGE_LABELS.noPricingTiersDesc}
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-blue-50/50 text-center border border-dashed border-blue-200 flex flex-col items-center justify-center py-6">
          <Icon name="Lock" className="w-6 h-6 text-blue-400 mb-2" />
          <p className="text-sm font-medium text-blue-900 mb-1">
            {PUBLIC_PAGE_LABELS.wholesaleOnly}
          </p>
          <p className="text-xs text-blue-600/80 mb-3 text-center">
            {PUBLIC_PAGE_LABELS.loginToViewDiscount}
          </p>
          <Button size="sm" onClick={onOpenLogin}>
            {PUBLIC_PAGE_LABELS.loginBtn}
          </Button>
        </div>
      )}
    </div>
  );
}
