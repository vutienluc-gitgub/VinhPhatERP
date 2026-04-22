import { useWatch, type Control } from 'react-hook-form';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchLatestYarnPrices } from '@/api/yarn-receipts.api';
import {
  calculateDirectYarnCost,
  calculateGreigeCostEstimation,
} from '@/domain/production/ProductionDomain';

import type { CreateWorkOrderInput } from './work-orders.module';

/* ── Snapshot that parent form captures for persistence ── */

export interface CostEstimationSnapshot {
  est_yarn_price: number;
  est_profit_margin_pct: number;
  est_transport_cost: number;
  est_additional_costs: { key: string; label: string; amount: number }[];
  est_total_cost: number;
  suggested_price: number;
}

interface GreigePriceEstimatorProps {
  control: Control<CreateWorkOrderInput>;
  /** Callback fired whenever estimation result changes */
  onEstimationChange?: (snapshot: CostEstimationSnapshot | null) => void;
}

export function GreigePriceEstimator({
  control,
  onEstimationChange,
}: GreigePriceEstimatorProps) {
  const targetWeightKg = useWatch({ control, name: 'target_weight_kg' }) || 0;
  const targetQuantity = useWatch({ control, name: 'target_quantity' }) || 0;
  const targetUnit = useWatch({ control, name: 'target_unit' }) || 'kg';
  const weavingUnitPrice =
    useWatch({ control, name: 'weaving_unit_price' }) || 0;
  const standardLossPct = useWatch({ control, name: 'standard_loss_pct' }) || 0;
  const rawYarnRequirements = useWatch({ control, name: 'yarn_requirements' });
  const yarnRequirements = useMemo(
    () => rawYarnRequirements || [],
    [rawYarnRequirements],
  );

  // Get unique yarn catalog ids
  const catalogIds = useMemo(() => {
    const ids = yarnRequirements.map((y) => y.yarn_catalog_id).filter(Boolean);
    return Array.from(new Set(ids)) as string[];
  }, [yarnRequirements]);

  // Fetch real latest prices
  const {
    data: yarnPricesMap,
    isLoading: isPriceLoading,
    isError: isPriceError,
  } = useQuery({
    queryKey: ['latest_yarn_prices', catalogIds],
    queryFn: () => fetchLatestYarnPrices(catalogIds),
    enabled: catalogIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - price data does not change often
  });

  // Tinh truc tiep chi phi soi tu du lieu thuc (khong qua trung gian)
  const { directYarnCost, derivedAvgPrice } = useMemo(() => {
    if (!yarnPricesMap || yarnRequirements.length === 0) {
      return { directYarnCost: 0, derivedAvgPrice: 0 };
    }

    return calculateDirectYarnCost(yarnRequirements, yarnPricesMap);
  }, [yarnPricesMap, yarnRequirements]);

  // Local state for estimation (user-adjustable parameters)
  const [profitMargin, setProfitMargin] = useState(15);

  const processingLabel =
    targetUnit === 'kg'
      ? `Giá công (${targetQuantity} ${targetUnit})`
      : `Công dệt (${targetQuantity} m)`;

  const hasResult =
    targetWeightKg > 0 && targetQuantity > 0 && directYarnCost > 0;

  // Build a compatible result object for the snapshot
  const result = useMemo(() => {
    if (!hasResult) return null;
    return calculateGreigeCostEstimation(
      directYarnCost,
      standardLossPct,
      weavingUnitPrice,
      targetQuantity,
      profitMargin,
    );
  }, [
    hasResult,
    directYarnCost,
    standardLossPct,
    weavingUnitPrice,
    targetQuantity,
    profitMargin,
  ]);

  // Notify parent of estimation changes
  const callbackRef = useRef(onEstimationChange);
  callbackRef.current = onEstimationChange;

  useEffect(() => {
    if (!callbackRef.current) return;

    if (!result) {
      callbackRef.current(null);
      return;
    }

    const snapshot: CostEstimationSnapshot = {
      est_yarn_price: derivedAvgPrice,
      est_profit_margin_pct: profitMargin,
      est_transport_cost: 0,
      est_additional_costs: [],
      est_total_cost: result.totalCost,
      suggested_price: result.finalPrice,
    };

    callbackRef.current(snapshot);
  }, [result?.totalCost, result?.finalPrice, derivedAvgPrice, profitMargin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!targetWeightKg || !targetQuantity) return null;

  return (
    <div className="mt-4 p-4 border border-border bg-bg rounded shadow-sm">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        Dự toán Giá Thành Vải Mộc
        {isPriceLoading && (
          <span className="text-xs font-normal text-muted animate-pulse">
            Đang tải giá sợi...
          </span>
        )}
      </h3>

      {isPriceError && (
        <p className="text-xs text-danger mb-3">
          Không thể tải giá sợi từ phiếu nhập. Vui lòng kiểm tra kết nối và thử
          lại.
        </p>
      )}

      <div className="flex gap-4 mb-4">
        <div className="flex-1 form-field">
          <label className="text-xs">Giá sợi TB từ phiếu nhập (VNĐ/kg)</label>
          <div className="field-input text-sm bg-surface cursor-default">
            {isPriceLoading ? (
              <span className="text-muted animate-pulse">Đang tải...</span>
            ) : derivedAvgPrice > 0 ? (
              derivedAvgPrice.toLocaleString()
            ) : (
              <span className="text-warning">Chưa có dữ liệu</span>
            )}
          </div>
        </div>
        <div className="flex-1 form-field">
          <label className="text-xs">Biên Lợi nhuận Kỳ vọng (%)</label>
          <input
            type="number"
            className="field-input text-sm"
            value={profitMargin}
            onChange={(e) => setProfitMargin(Number(e.target.value))}
            min="0"
            max="100"
          />
        </div>
      </div>

      {isPriceLoading && (
        <div className="grid grid-cols-2 gap-4 text-sm bg-surface p-3 rounded border border-border/50 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-3 bg-border rounded w-2/3 mb-2" />
              <div className="h-4 bg-border rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isPriceLoading && result && (
        <div className="grid grid-cols-2 gap-4 text-sm bg-surface p-3 rounded border border-border/50">
          <div>
            <p className="text-muted mb-1">Chi phí Sợi (từ phiếu nhập):</p>
            <p className="font-semibold">
              {result.directYarnCost.toLocaleString()} đ
            </p>
          </div>
          <div>
            <p className="text-muted mb-1">{processingLabel}:</p>
            <p className="font-semibold">
              {result.processingCost.toLocaleString()} đ
            </p>
          </div>
          <div>
            <p className="text-muted mb-1">
              Chi phí Hao hụt ({standardLossPct}%):
            </p>
            <p className="font-semibold text-danger">
              {result.wasteCost.toLocaleString()} đ
            </p>
          </div>
          <div>
            <p className="text-muted mb-1">Tổng Giá Vốn:</p>
            <p className="font-bold text-primary">
              {result.totalCost.toLocaleString()} đ
            </p>
          </div>
          <div className="col-span-2 mt-2 pt-2 border-t border-border/50 flex justify-between items-end">
            <div>
              <p className="text-muted mb-1">Giá Bán Khuyến nghị:</p>
              <h4 className="text-lg font-bold text-success">
                {result.finalPrice.toLocaleString()} đ
              </h4>
            </div>
            {targetQuantity > 0 && (
              <div className="text-right">
                <p className="text-muted mb-1">Giá bán trên 1 {targetUnit}:</p>
                <p className="font-bold">
                  {Math.round(
                    result.finalPrice / targetQuantity,
                  ).toLocaleString()}{' '}
                  đ/{targetUnit}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!isPriceLoading && !isPriceError && !result && catalogIds.length > 0 && (
        <p className="text-xs text-warning">
          Chưa có phiếu nhập sợi (đã xác nhận) cho các loại sợi trong BOM này.
        </p>
      )}
    </div>
  );
}
