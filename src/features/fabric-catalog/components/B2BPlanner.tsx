import { useState } from 'react';

import { useGarmentConversionRules } from '@/application/settings/useFabricCatalog';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { Badge } from '@/shared/components';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

import {
  calculateFabricLength,
  calculateGarmentProduction,
} from './b2b-planner.utils';

type B2BPlannerProps = {
  fabric: Partial<FabricCatalog>;
};

export function B2BPlanner({ fabric }: B2BPlannerProps) {
  const [qtyInput, setQtyInput] = useState<string>('100');
  const { data: garmentRules } = useGarmentConversionRules();

  const weightKg = Number(qtyInput) || 0;
  const moq =
    fabric.commercial?.minimum_order_qty_kg ||
    fabric.commercial?.minimum_order_qty ||
    0;
  const isMoqMet = weightKg > 0 && weightKg >= moq;

  const leadTime = fabric.commercial?.lead_time_days || 7;
  const capacity = fabric.commercial?.production_capacity_monthly_tons || 20;

  const lengthMeters = calculateFabricLength(
    weightKg,
    fabric.target_gsm,
    fabric.target_width_cm,
  );
  const isMissingSpecs =
    weightKg > 0 && (!fabric.target_gsm || !fabric.target_width_cm);

  const yieldFactor = fabric.commercial?.yield_factor || 1.0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-100">
        <h3 className="text-base font-bold text-gray-900">
          Production Planning Calculator
        </h3>
        <p className="text-xs text-muted mt-1">
          Ước tính sản lượng & năng lực cung ứng B2B
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            {LABELS.calculatorQtyLabel}
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-xl pl-3 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-bold transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs font-bold text-slate-500">kg</span>
            </div>
          </div>
        </div>

        {/* MOQ & Capacity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              MOQ Checker
            </span>
            {weightKg > 0 ? (
              isMoqMet ? (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                    <Badge showDot variant="success" className="px-0 py-0" />
                    Đạt MOQ
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">
                    Tối thiểu {moq}kg
                  </span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-amber-600 flex items-center gap-1.5">
                    <Badge showDot variant="warning" className="px-0 py-0" />
                    Chưa đạt MOQ
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">
                    Cần tối thiểu {moq}kg
                  </span>
                </div>
              )
            ) : (
              <span className="text-sm font-medium text-slate-400">--</span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Năng lực cung ứng
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">
                Giao trong {leadTime} ngày
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                Năng lực: {capacity} tấn/tháng
              </span>
            </div>
          </div>
        </div>

        {/* Estimations */}
        {weightKg > 0 && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {/* Fabric Length */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Fabric Length Calculator
                </span>
                {lengthMeters !== null && (
                  <span className="text-base font-black text-primary">
                    ≈ {lengthMeters} mét
                  </span>
                )}
              </div>
              {isMissingSpecs && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 text-xs font-medium">
                  Không đủ dữ liệu để tính chiều dài vải.{' '}
                  {!fabric.target_gsm && 'Thiếu GSM.'}{' '}
                  {!fabric.target_width_cm && 'Thiếu Khổ vải.'}
                </div>
              )}
            </div>

            {/* Garments Production */}
            {garmentRules && garmentRules.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Production Estimator
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {garmentRules.map((rule) => {
                    const estimatedQty = calculateGarmentProduction(
                      weightKg,
                      rule.avg_consumption_kg,
                      yieldFactor,
                    );
                    return (
                      <div
                        key={rule.id}
                        className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100/50 flex justify-between items-center"
                      >
                        <span className="text-xs font-medium text-slate-600">
                          {rule.name}
                        </span>
                        <span className="text-sm font-bold text-blue-700">
                          ≈ {estimatedQty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
