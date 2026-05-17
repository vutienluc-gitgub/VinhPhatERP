import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Icon } from '@/shared/components/Icon';
import { fetchBomList } from '@/api/bom.api';
import { saveCostEstimation } from '@/api/cost-estimations.api';
import { useGreigeCosting } from '@/features/costing/hooks/useGreigeCosting';
import { YarnCostEditor } from '@/features/costing/components/YarnCostEditor';
import { CostBreakdownTable } from '@/features/costing/components/CostBreakdownTable';

interface GreigeCalculatorModalProps {
  open: boolean;
  onClose: () => void;
}

export function GreigeCalculatorModal({
  open,
  onClose,
}: GreigeCalculatorModalProps) {
  const {
    selectedBomId,
    setSelectedBomId,
    state,
    updateState,
    updateYarnItem,
    result,
    isLoadingBom,
    reset,
  } = useGreigeCosting();

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch approved BOMs to select
  const { data: bomList, isLoading: isBomListLoading } = useQuery({
    queryKey: ['bom_list_for_calculator'],
    queryFn: () => fetchBomList({ status: 'approved' }),
    enabled: open,
  });

  // Reset when closed
  useEffect(() => {
    if (!open) {
      reset();
      setSaveSuccess(false);
    }
  }, [open, reset]);

  // Escape to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleSaveSnapshot = async () => {
    if (!state || !result || !state.bom_template_id) return;
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      const payload = {
        reference_type: 'bom' as const,
        reference_id: state.bom_template_id,
        target_width_cm: null,
        target_gsm: null,
        est_yarn_price: result.directYarnCost, // total yarn cost
        est_profit_margin_pct: state.profitMarginPct,
        est_transport_cost: 0,
        est_additional_costs: [],
        est_total_cost: result.totalCost,
        suggested_price: result.finalPrice,
      };

      await saveCostEstimation(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save simulation:', error);
      alert('Có lỗi xảy ra khi lưu snapshot giả lập trên Cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:max-h-[90vh] bg-surface rounded-xl shadow-2xl border border-border flex flex-col z-[101] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/5">
          <div className="flex items-center gap-2 text-primary-strong">
            <Icon name="Calculator" size={20} />
            <h2 id="modal-title" className="text-lg font-bold">
              Máy tính Giá Vải Mộc (Costing Studio)
            </h2>
          </div>
          <button
            type="button"
            className="p-1.5 text-muted hover:text-foreground hover:bg-border/50 rounded transition-colors"
            onClick={onClose}
            aria-label="Đóng"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-background custom-scrollbar">
          {/* Section 1: Choose BOM */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              1. Chọn Định mức (BOM)
            </label>
            <select
              className="field-input w-full text-sm font-medium"
              value={selectedBomId || ''}
              onChange={(e) => setSelectedBomId(e.target.value)}
              disabled={isBomListLoading}
            >
              <option value="">-- Chọn BOM đã duyệt để giả lập --</option>
              {bomList?.map((bom) => (
                <option key={bom.id} value={bom.id}>
                  [{bom.code}] {bom.name}
                </option>
              ))}
            </select>
            {isLoadingBom && (
              <p className="text-xs text-primary mt-2 animate-pulse">
                Đang tải chi tiết BOM và giá sợi mới nhất...
              </p>
            )}
          </div>

          {/* Section 2: Simulator Variables */}
          {state && (
            <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-field">
                  <label className="text-xs">Đơn giá dệt</label>
                  <div className="flex">
                    <input
                      type="number"
                      className="field-input text-sm rounded-r-none border-r-0"
                      value={state.weaving_unit_price}
                      onChange={(e) =>
                        updateState({
                          weaving_unit_price: Number(e.target.value),
                        })
                      }
                      min="0"
                    />
                    <select
                      className="field-input text-sm rounded-l-none w-20 bg-muted/10 px-2"
                      value={state.weaving_price_unit}
                      onChange={(e) =>
                        updateState({
                          weaving_price_unit: e.target.value as 'kg' | 'm',
                        })
                      }
                    >
                      <option value="kg">/kg</option>
                      <option value="m">/m</option>
                    </select>
                  </div>
                </div>
                <div className="form-field">
                  <label className="text-xs">Hao hụt chuẩn (%)</label>
                  <input
                    type="number"
                    className="field-input text-sm"
                    value={state.standard_loss_pct}
                    onChange={(e) =>
                      updateState({ standard_loss_pct: Number(e.target.value) })
                    }
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-field">
                  <label className="text-xs">Biên Lợi Nhuận (%)</label>
                  <input
                    type="number"
                    className="field-input text-sm text-success font-bold"
                    value={state.profitMarginPct}
                    onChange={(e) =>
                      updateState({ profitMarginPct: Number(e.target.value) })
                    }
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Yarn Cost Overrides */}
              <YarnCostEditor
                items={state.yarnItems}
                onChange={updateYarnItem}
              />
            </div>
          )}

          {/* Section 3: Results */}
          {result && state && (
            <div className="animate-in fade-in slide-in-from-bottom-4 border-t border-border pt-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <CostBreakdownTable
                    breakdown={result.breakdown}
                    totalCost={result.totalCost}
                  />
                </div>
                <div className="w-full md:w-[250px] flex flex-col gap-4">
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                    <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-1">
                      Giá Bán Đề Xuất
                    </p>
                    <div className="text-2xl font-black text-primary-strong">
                      {Math.round(result.suggestedPricePerM).toLocaleString()} đ
                      <span className="text-sm font-normal text-muted">/m</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveSnapshot}
                    disabled={isSaving}
                    className="btn btn-secondary w-full py-2.5 flex items-center justify-center gap-2"
                  >
                    <Icon
                      name={isSaving ? 'Loader2' : 'Cloud'}
                      size={16}
                      className={isSaving ? 'animate-spin' : ''}
                    />
                    {isSaving ? 'Đang lưu...' : 'Lưu Snapshot lên Cloud'}
                  </button>

                  {saveSuccess && (
                    <p className="text-xs text-success text-center">
                      Đã lưu snapshot thành công!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
