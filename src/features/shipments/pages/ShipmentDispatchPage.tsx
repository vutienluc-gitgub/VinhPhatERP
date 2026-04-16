import { useMemo, useState } from 'react';

import { Icon } from '@/shared/components/Icon';
import { Button } from '@/shared/components';
import { TacticalBoard } from '@/shared/components/ops-ui';
import { useAvailableFinishedRolls } from '@/application/shipments';
import { useFleetCommander } from '@/features/shipments/ops-engine/useFleetCommander';
import { ShipmentRollBlock } from '@/features/shipments/components/ops/ShipmentRollBlock';
import { TruckBay } from '@/features/shipments/components/ops/TruckBay';
import { DispatchConfirmSheet } from '@/features/shipments/components/ops/DispatchConfirmSheet';

/**
 * ShipmentDispatchPage — Tactical Ops UI for dispatching rolls to trucks.
 *
 * Layout:
 * - Left: Pool of unassigned rolls (Draggable EntityCards)
 * - Right: Truck bays (Droppable ResourceBays)
 */
export function ShipmentDispatchPage() {
  // Fetch all available rolls (no order filter = global pool)
  const { data: availableRolls = [], isLoading } = useAvailableFinishedRolls();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Brain hook
  const {
    unassignedRolls,
    fleet,
    truckStats,
    isCommitting,
    rollToGrade,
    handleMoveComplete,
    commitDispatch,
    autoOptimizeFleet,
  } = useFleetCommander(availableRolls);

  // Derived totals
  const poolStats = useMemo(
    () => ({
      count: unassignedRolls.length,
      totalKg: unassignedRolls.reduce((s, r) => s + (r.weight_kg ?? 0), 0),
    }),
    [unassignedRolls],
  );

  const totalAssigned = useMemo(() => {
    let count = 0;
    let kg = 0;
    for (const stats of truckStats.values()) {
      count += stats.count;
      kg += stats.totalKg;
    }
    return {
      count,
      kg,
    };
  }, [truckStats]);

  const activeTrucks = useMemo(
    () => fleet.filter((truck) => truck.rolls.length > 0),
    [fleet],
  );

  const handleConfirmAction = async (orderId: string, customerId: string) => {
    await commitDispatch(orderId, customerId);
    setIsConfirmOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-muted animate-pulse">
          Đang tải dữ liệu...
        </span>
      </div>
    );
  }

  return (
    <TacticalBoard onMoveComplete={handleMoveComplete}>
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-slate-900 p-5 sm:p-6 text-white shadow-xl">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-emerald-400">
              Sa Bàn Điều Phối Giao Hàng
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Kéo thả cuộn vải vào xe tải - hoặc Nhấn chọn rồi Nhấn đích.
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                Kho
              </span>
              <span className="text-lg font-bold">{poolStats.count} cuộn</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                Đã xếp
              </span>
              <span className="text-lg font-bold text-emerald-400">
                {totalAssigned.count} cuộn · {totalAssigned.kg.toFixed(1)} kg
              </span>
            </div>
            <div className="pl-4 border-l border-slate-700 flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={autoOptimizeFleet}
                disabled={isCommitting || unassignedRolls.length === 0}
                className="bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-transparent"
              >
                <Icon name="Wand2" size={16} className="mr-2" />
                Tự xếp xe
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isCommitting || totalAssigned.count === 0}
                className={
                  totalAssigned.count > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    : ''
                }
              >
                {isCommitting ? (
                  <span className="animate-pulse">Đang xử lý...</span>
                ) : (
                  <>
                    <Icon name="Send" size={16} className="mr-2" />
                    Phát Lệnh
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: POOL */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <Icon name="PackageOpen" className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-extrabold uppercase text-slate-800">
                Kho Trung Chuyển ({poolStats.count})
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm max-h-[70vh] overflow-y-auto">
              {unassignedRolls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Icon
                    name="PackageOpen"
                    className="h-8 w-8 mb-2 opacity-40"
                  />
                  <span className="text-sm">Đã xếp hết cuộn vào xe</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {unassignedRolls.map((roll) => (
                    <ShipmentRollBlock
                      key={roll.id}
                      roll={roll}
                      grade={rollToGrade(roll)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: FLEET */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            {fleet.map((truck) => (
              <TruckBay key={truck.id} truck={truck}>
                {truck.rolls.map((roll) => (
                  <ShipmentRollBlock
                    key={roll.id}
                    roll={roll}
                    grade={rollToGrade(roll)}
                  />
                ))}
              </TruckBay>
            ))}
          </div>
        </div>
      </div>

      <DispatchConfirmSheet
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        activeTrucks={activeTrucks}
        onConfirm={handleConfirmAction}
        isCommitting={isCommitting}
      />
    </TacticalBoard>
  );
}
