import { useState } from 'react';

import { Badge, Button, Icon, VPSelect } from '@/shared/components';
import type {
  FabricCatalog,
  FabricVariant,
} from '@/domain/settings/fabric-catalog.types';
import { PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import {
  useB2BPlannerLogic,
  type B2BInputMode,
} from '@/features/fabric-catalog/hooks/useB2BPlannerLogic';
import { useInquiry } from '@/features/fabric-catalog/hooks/useInquiry';

type B2BPlannerProps = {
  fabric: Partial<FabricCatalog>;
  activeVariant?: FabricVariant | null;
};

// Simple mapping from rule name to Icon
function getGarmentIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('áo khoác') || lower.includes('hoodie'))
    return <Icon name="Wind" className="w-4 h-4" />;
  if (lower.includes('áo') || lower.includes('shirt') || lower.includes('polo'))
    return <Icon name="Shirt" className="w-4 h-4" />;
  if (lower.includes('quần'))
    return <Icon name="Scissors" className="w-4 h-4" />;
  return <Icon name="Shirt" className="w-4 h-4" />;
}

export function B2BPlanner({ fabric, activeVariant }: B2BPlannerProps) {
  const { openInquiry } = useInquiry();

  const [mode, setMode] = useState<B2BInputMode>('weight');
  const [value, setValue] = useState<string>('100');
  const [garmentRuleId, setGarmentRuleId] = useState<string>('');

  const {
    weightKg,
    moq,
    isMoqMet,
    expectedDeliveryDate,
    capacityTons,
    capacityUtilizationPct,
    lengthMeters,
    estimatedGarments,
    garmentRules,
    plannerContext,
    // Phase 2
    inventoryAvailableKg,
    needsProduction,
    missingProductionKg,
    deliveryTimeline,
    netWeightKg,
    wasteKg,
    estimatedRolls,
  } = useB2BPlannerLogic(
    fabric,
    { mode, value, garmentRuleId },
    activeVariant ?? undefined,
  );

  // Auto-select first garment rule when switching to 'garment' mode
  const handleModeChange = (newMode: B2BInputMode) => {
    setMode(newMode);
    if (
      newMode === 'garment' &&
      !garmentRuleId &&
      garmentRules &&
      garmentRules.length > 0
    ) {
      setGarmentRuleId(garmentRules[0]?.id || '');
    }
    if (newMode === 'weight') setValue('100');
    if (newMode === 'length') setValue('300');
    if (newMode === 'garment') setValue('1000');
  };

  const handleRequestQuote = () => {
    openInquiry({
      leadSource: 'planner',
      isBatchRequest: false,
      plannerContext,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 bg-surface-secondary">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          {COMP_LABELS.B2B_PLANNER_TITLE}
          <Badge variant="info" className="text-[10px] px-1.5 py-0">
            v2
          </Badge>
        </h3>
        <p className="text-xs text-muted mt-1">
          {COMP_LABELS.B2B_PLANNER_DESC}
        </p>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Smart Input */}
        <div className="space-y-3">
          <div className="flex bg-surface-secondary p-1 rounded-lg gap-1">
            <button
              onClick={() => handleModeChange('weight')}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'weight' ? 'bg-white shadow-sm text-primary' : 'text-muted hover:text-secondary'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icon name="Scale" className="w-3.5 h-3.5" />
                {COMP_LABELS.B2B_INPUT_MODE_WEIGHT}
              </div>
            </button>
            <button
              onClick={() => handleModeChange('length')}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'length' ? 'bg-white shadow-sm text-primary' : 'text-muted hover:text-secondary'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icon name="Ruler" className="w-3.5 h-3.5" />
                {COMP_LABELS.B2B_INPUT_MODE_LENGTH}
              </div>
            </button>
            <button
              onClick={() => handleModeChange('garment')}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${mode === 'garment' ? 'bg-white shadow-sm text-primary' : 'text-muted hover:text-secondary'}`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icon name="Shirt" className="w-3.5 h-3.5" />
                {COMP_LABELS.B2B_INPUT_MODE_GARMENT}
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">
                {COMP_LABELS.B2B_QUANTITY_INPUT_LABEL}
              </span>
              <div className="flex flex-col gap-2">
                <div className="relative w-full">
                  <input
                    type="number"
                    min="1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full text-base rounded-xl pl-3 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface-secondary font-black transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-sm font-bold text-muted">
                      {mode === 'weight'
                        ? 'kg'
                        : mode === 'length'
                          ? 'm'
                          : COMP_LABELS.B2B_UNIT_GARMENT}
                    </span>
                  </div>
                </div>

                {mode === 'garment' &&
                  garmentRules &&
                  garmentRules.length > 0 && (
                    <VPSelect
                      options={garmentRules.map((r) => ({
                        value: r.id,
                        label: r.name,
                      }))}
                      value={garmentRuleId}
                      onValueChange={setGarmentRuleId}
                      className="w-full bg-surface-secondary border-none h-11 text-sm font-medium rounded-xl"
                    />
                  )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-secondary flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">
                {mode === 'length'
                  ? COMP_LABELS.B2B_EQUIVALENT_WEIGHT
                  : COMP_LABELS.B2B_LENGTH_CALC}
              </span>

              {mode === 'length' ? (
                <span className="text-base font-black text-primary truncate">
                  {weightKg} kg
                </span>
              ) : lengthMeters !== null ? (
                <span className="text-base font-black text-primary truncate">
                  {COMP_LABELS.B2B_EST_LENGTH.replace(
                    '{lengthMeters}',
                    Number(lengthMeters).toFixed(1),
                  )}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-danger leading-tight">
                  {COMP_LABELS.B2B_MISSING_DATA}
                </span>
              )}
            </div>
          </div>

          {mode === 'garment' && weightKg > 0 && (
            <div className="text-xs text-muted font-medium bg-surface-secondary px-3 py-2 rounded-lg flex items-center justify-between">
              <span>{COMP_LABELS.B2B_EQUIVALENT_WEIGHT}</span>
              <span className="font-bold text-primary">{weightKg} kg</span>
            </div>
          )}
        </div>

        {/* Phase 2: Inventory & Commercial Validation */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface-secondary flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
                {COMP_LABELS.B2B_INVENTORY_LABEL}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {COMP_LABELS.B2B_INVENTORY_AVAILABLE.replace(
                  '{qty}',
                  String(inventoryAvailableKg),
                )}
              </span>
            </div>
            {weightKg > 0 ? (
              !needsProduction ? (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-success flex items-center gap-1.5">
                    <Badge showDot variant="success" className="px-0 py-0" />
                    {COMP_LABELS.B2B_ENOUGH_STOCK}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-warning flex items-center gap-1.5">
                    <Badge showDot variant="warning" className="px-0 py-0" />
                    {COMP_LABELS.B2B_NEED_PROD.replace(
                      '{qty}',
                      String(missingProductionKg),
                    )}
                  </span>
                  {!isMoqMet && (
                    <span className="text-[10px] text-danger font-medium mt-1">
                      {COMP_LABELS.B2B_MOQ_WARNING.replace(
                        '{moq}',
                        String(moq),
                      )}
                    </span>
                  )}
                </div>
              )
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                --
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-surface-secondary flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-muted tracking-wider mb-2">
              {COMP_LABELS.B2B_SUPPLY_CAP}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-primary">
                {needsProduction
                  ? COMP_LABELS.B2B_EXPECTED_DATE.replace(
                      '{date}',
                      expectedDeliveryDate,
                    )
                  : COMP_LABELS.B2B_DELIVERY_NOW}
              </span>

              {capacityTons > 0 && needsProduction && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted font-medium">
                      {COMP_LABELS.B2B_CAPACITY_USAGE.replace(
                        '{pct}',
                        capacityUtilizationPct.toFixed(1),
                      )}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-info-soft"
                      style={{
                        width: `${Math.min(capacityUtilizationPct, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phase 2: Delivery Timeline */}
        {weightKg > 0 && needsProduction && deliveryTimeline && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-secondary block">
              {COMP_LABELS.B2B_TIMELINE_TITLE}
            </span>
            <div className="flex gap-1 h-2 w-full">
              {deliveryTimeline.map((step, idx) => (
                <div
                  key={idx}
                  className={`h-full rounded-full ${idx === 0 ? 'bg-info-soft' : idx === 1 ? 'bg-info-soft' : idx === 2 ? 'bg-sky-400' : 'bg-success-soft'}`}
                  style={{ width: `${step.percentage}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted font-medium mt-1">
              {deliveryTimeline.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span>{step.step}</span>
                  <span className="text-muted-foreground">
                    {COMP_LABELS.B2B_DAYS.replace('{days}', String(step.days))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 2: Yield Analysis & Roll Estimation */}
        {weightKg > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-surface-secondary">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1.5">
                {COMP_LABELS.B2B_WASTE_ANALYSIS}
              </span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">{COMP_LABELS.B2B_NET_FABRIC}</span>
                <span className="font-bold">{netWeightKg.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-muted">{COMP_LABELS.B2B_EST_WASTE}</span>
                <span className="font-bold text-danger">
                  {wasteKg.toFixed(1)} kg
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-secondary">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1.5">
                {COMP_LABELS.B2B_ROLL_CONVERSION}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-info">
                  <Icon name="Archive" className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-primary">
                    {COMP_LABELS.B2B_EST_ROLLS.replace(
                      '{rolls}',
                      String(estimatedRolls),
                    )}
                  </span>
                  <span className="text-[10px] text-muted">
                    {COMP_LABELS.B2B_KG_PER_ROLL}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estimations */}
        {weightKg > 0 && (
          <div className="space-y-4 pt-2">
            {/* Fabric Length removed and merged into top grid */}

            {/* Garments Production */}
            {estimatedGarments.length > 0 && mode !== 'garment' && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-secondary block">
                  {COMP_LABELS.B2B_PROD_ESTIMATOR}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {estimatedGarments.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-2.5 rounded-xl bg-surface-secondary flex items-center gap-2"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-muted border border-default shrink-0">
                        {getGarmentIcon(rule.name)}
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-[10px] font-medium text-muted truncate">
                          {rule.name}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          ≈ {rule.estimatedQty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-4 bg-surface-secondary">
        <Button
          variant="primary"
          className="w-full font-bold shadow-sm"
          onClick={handleRequestQuote}
        >
          {COMP_LABELS.B2B_REQ_QUOTE_BTN}
        </Button>
      </div>
    </div>
  );
}
