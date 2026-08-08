/**
 * YarnIssueModal — Modal for selecting yarn receipt lots to issue for a Work Order.
 *
 * Features:
 * - Groups available lots by yarn_catalog_id (matching WO requirements)
 * - FIFO auto-allocation: fills oldest lots first up to required_kg
 * - Manual override: user can adjust issued_kg per lot
 * - Atomic submission via rpc_issue_yarn_lots
 */
import { useState, useMemo, useCallback, useEffect } from 'react';

import { Icon, Badge } from '@/shared/components';
import { formatQuantity } from '@/shared/utils/format';
import {
  useAvailableYarnLots,
  useIssueYarnLots,
  useWorkOrderRequirements,
} from '@/application/production';
import type {
  AvailableYarnLot,
  IssueYarnLotItem,
  WorkOrderYarnRequirementWithRelations,
} from '@/domain/production/work-orders.types';

interface YarnIssueModalProps {
  workOrderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

/** FIFO auto-allocate: fill lots from oldest to newest until requiredKg is met. */
function autoAllocateFIFO(
  lots: AvailableYarnLot[],
  requiredKg: number,
): Map<string, number> {
  const result = new Map<string, number>();
  let remaining = requiredKg;

  for (const lot of lots) {
    if (remaining <= 0) break;
    const allocate = Math.min(lot.available_qty, remaining);
    if (allocate > 0) {
      result.set(lot.yarn_receipt_item_id, allocate);
      remaining -= allocate;
    }
  }

  return result;
}

function RequirementGroup({
  requirement,
  lots,
  allocations,
  onAllocationChange,
}: {
  requirement: WorkOrderYarnRequirementWithRelations;
  lots: AvailableYarnLot[];
  allocations: Map<string, number>;
  onAllocationChange: (lotId: string, kg: number) => void;
}) {
  let totalAllocated = 0;
  for (const lot of lots) {
    totalAllocated += allocations.get(lot.yarn_receipt_item_id) ?? 0;
  }

  const isFullyAllocated = totalAllocated >= requirement.required_kg;
  const deficit = requirement.required_kg - totalAllocated;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Group Header */}
      <div className="bg-surface-subtle px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Icon name="Package" size={18} className="text-foreground" />
          <div>
            <p className="font-bold text-sm">
              {requirement.yarn_catalog?.name ?? 'N/A'}
            </p>
            {requirement.yarn_catalog?.color_name && (
              <p className="text-xs text-muted-foreground">
                {requirement.yarn_catalog.color_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {formatQuantity(totalAllocated)} /{' '}
            {formatQuantity(requirement.required_kg)} kg
          </span>
          {isFullyAllocated ? (
            <Badge variant="success">OK</Badge>
          ) : (
            <Badge variant="warning">Thieu {formatQuantity(deficit)} kg</Badge>
          )}
        </div>
      </div>

      {/* Lot Table */}
      {lots.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          <Icon
            name="AlertTriangle"
            size={20}
            className="inline mr-2 text-warning"
          />
          Khong co lo soi kha dung cho loai nay trong kho.
        </div>
      ) : (
        <div className="card-table-section">
          <table className="data-table text-sm">
            <thead>
              <tr>
                <th>Phieu nhap</th>
                <th className="max-sm:hidden">NCC</th>
                <th className="max-sm:hidden">Lo (Lot)</th>
                <th className="text-right">Ton kho (kg)</th>
                <th className="text-right" style={{ width: 120 }}>
                  Xuat (kg)
                </th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => {
                const currentValue =
                  allocations.get(lot.yarn_receipt_item_id) ?? 0;
                return (
                  <tr key={lot.yarn_receipt_item_id}>
                    <td>
                      <div>
                        <span className="font-bold text-foreground">
                          {lot.receipt_number}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(lot.receipt_date).toLocaleDateString(
                            'vi-VN',
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="max-sm:hidden text-muted-foreground text-sm">
                      {lot.supplier_name}
                    </td>
                    <td className="max-sm:hidden text-muted-foreground text-sm">
                      {lot.lot_number ?? '—'}
                    </td>
                    <td className="text-right font-medium tabular-nums">
                      {formatQuantity(lot.available_qty)}
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        className="form-input text-right tabular-nums"
                        style={{ width: 100 }}
                        min={0}
                        max={lot.available_qty}
                        step={0.1}
                        value={currentValue || ''}
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const clamped = Math.min(val, lot.available_qty);
                          onAllocationChange(lot.yarn_receipt_item_id, clamped);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function YarnIssueModal({
  workOrderId,
  onClose,
  onSuccess,
}: YarnIssueModalProps) {
  const { data: requirements, isLoading: isLoadingReqs } =
    useWorkOrderRequirements(workOrderId);

  const catalogIds = useMemo(
    () =>
      (requirements ?? [])
        .map((r) => r.yarn_catalog_id)
        .filter((id): id is string => !!id),
    [requirements],
  );

  const { data: availableLots, isLoading: isLoadingLots } =
    useAvailableYarnLots(catalogIds);

  const issueYarnMutation = useIssueYarnLots();

  // Map<yarn_receipt_item_id, allocated_kg>
  const [allocations, setAllocations] = useState<Map<string, number>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);

  // Group available lots by yarn_catalog_id
  const lotsByCatalog = useMemo(() => {
    const map = new Map<string, AvailableYarnLot[]>();
    for (const lot of availableLots ?? []) {
      if (!lot.yarn_catalog_id) continue;
      const existing = map.get(lot.yarn_catalog_id) ?? [];
      existing.push(lot);
      map.set(lot.yarn_catalog_id, existing);
    }
    return map;
  }, [availableLots]);

  // FIFO auto-allocation on first load
  useEffect(() => {
    if (!requirements?.length || !availableLots?.length) return;
    if (allocations.size > 0) return; // already initialized

    const newAllocations = new Map<string, number>();
    for (const req of requirements) {
      const lots = lotsByCatalog.get(req.yarn_catalog_id) ?? [];
      const fifo = autoAllocateFIFO(lots, req.required_kg);
      for (const [lotId, kg] of fifo) {
        newAllocations.set(lotId, kg);
      }
    }
    setAllocations(newAllocations);
  }, [requirements, availableLots, lotsByCatalog, allocations.size]);

  const handleAllocationChange = useCallback((lotId: string, kg: number) => {
    setAllocations((prev) => {
      const next = new Map(prev);
      if (kg <= 0) {
        next.delete(lotId);
      } else {
        next.set(lotId, kg);
      }
      return next;
    });
    setError(null);
  }, []);

  const totalIssuedKg = useMemo(() => {
    let total = 0;
    for (const kg of allocations.values()) {
      total += kg;
    }
    return total;
  }, [allocations]);

  const handleSubmit = async () => {
    const lots: IssueYarnLotItem[] = [];
    for (const [lotId, kg] of allocations) {
      if (kg > 0) {
        lots.push({ yarn_receipt_item_id: lotId, issued_kg: kg });
      }
    }
    if (lots.length === 0) {
      setError('Vui long chon it nhat 1 lo soi de xuat kho.');
      return;
    }

    try {
      await issueYarnMutation.mutateAsync({
        workOrderId,
        lots,
      });
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  };

  const isLoading = isLoadingReqs || isLoadingLots;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 800, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Icon name="PackageOpen" size={22} className="text-foreground" />
            <h2 className="text-lg font-bold">Xuat kho soi cho lenh det</h2>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          className="modal-body"
          style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 160px)' }}
        >
          {isLoading ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <div className="spinner" />
              <p className="text-muted-foreground text-sm">
                Dang tai du lieu ton kho...
              </p>
            </div>
          ) : !requirements?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              Lenh det nay chua co yeu cau soi.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Info banner */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-info text-sm text-info">
                <Icon name="Info" size={18} className="mt-0.5 shrink-0" />
                <p>
                  He thong da tu dong phan bo theo FIFO (lo cu nhat uu tien).
                  Ban co the chinh sua so luong xuat tai cot &quot;Xuat
                  (kg)&quot;.
                </p>
              </div>

              {requirements.map((req) => (
                <RequirementGroup
                  key={req.id}
                  requirement={req}
                  lots={lotsByCatalog.get(req.yarn_catalog_id) ?? []}
                  allocations={allocations}
                  onAllocationChange={handleAllocationChange}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-danger text-sm text-danger">
              <Icon name="AlertCircle" size={16} className="inline mr-1" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
            <Icon name="Scale" size={16} />
            <span>
              Tong xuat:{' '}
              <strong className="text-foreground">
                {formatQuantity(totalIssuedKg)} kg
              </strong>
            </span>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Huy
          </button>
          <button
            type="button"
            className="btn-primary flex items-center gap-2"
            onClick={handleSubmit}
            disabled={issueYarnMutation.isPending || totalIssuedKg === 0}
          >
            {issueYarnMutation.isPending ? (
              <div className="spinner spinner-sm" />
            ) : (
              <Icon name="PackageCheck" size={16} />
            )}
            Xac nhan xuat kho
          </button>
        </div>
      </div>
    </div>
  );
}
