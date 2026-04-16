import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import type { OpsGrade } from '@/shared/components/ops-ui';
import {
  useDeliveryStaffList,
  useCreateShipment,
} from '@/application/shipments';
import {
  shipmentsDefaultValues,
  type ShipmentsFormValues,
} from '@/schema/shipment.schema';
import type { AvailableRoll } from '@/features/shipments/ShipmentRollPicker';

/* ── Types ── */

export interface TruckSlot {
  id: string;
  plate: string;
  driver: string;
  maxSlots: number;
  maxWeightKg: number;
  rolls: AvailableRoll[];
}

export interface ConstraintResult {
  allowed: boolean;
  reason?: string;
}

/* ── Grade Logic ── */

function rollToGrade(roll: AvailableRoll): OpsGrade {
  if (roll.status === 'reserved') return 'RESERVED';
  // Weight anomaly heuristic: No weight = grade C
  if (roll.weight_kg == null || roll.weight_kg <= 0) return 'C';
  return 'A';
}

/* ── Main Use-Case Hook ── */

export function useFleetCommander(availableRolls: AvailableRoll[]) {
  const { data: staffList = [] } = useDeliveryStaffList();

  // Pool = cuộn chưa bị gán vào xe nào
  const [assignments, setAssignments] = useState<Map<string, string>>(
    new Map(),
  );

  // Cập nhật fleet từ data thật. Do DB chưa có bảng Xe, ta sinh ngẫu nhiên tải trọng cho đến khi update Schema.
  const trucks = useMemo<TruckSlot[]>(() => {
    if (staffList.length === 0) {
      return [
        {
          id: 'truck-1',
          plate: '51C-123.45',
          driver: 'Nguyễn Văn A',
          maxSlots: 8,
          maxWeightKg: 150,
          rolls: [],
        },
        {
          id: 'truck-2',
          plate: '29B-999.99',
          driver: 'Trần Văn B',
          maxSlots: 6,
          maxWeightKg: 120,
          rolls: [],
        },
      ];
    }

    return staffList.map((staff, idx) => ({
      id: staff.id,
      plate: `51C-${(idx + 1).toString().padStart(3, '0')}.99`,
      driver: staff.full_name,
      maxSlots: 10,
      maxWeightKg: 300,
      rolls: [],
    }));
  }, [staffList]);

  // Derived: unassigned rolls (Pool)
  const unassignedRolls = useMemo(
    () => availableRolls.filter((r) => !assignments.has(r.id)),
    [availableRolls, assignments],
  );

  // Derived: fleet with assigned rolls
  const fleet = useMemo((): TruckSlot[] => {
    return trucks.map((truck) => {
      const truckRolls = availableRolls.filter(
        (r) => assignments.get(r.id) === truck.id,
      );
      return {
        ...truck,
        rolls: truckRolls,
      };
    });
  }, [trucks, availableRolls, assignments]);

  // Derived: summary stats per truck
  const truckStats = useMemo(() => {
    const map = new Map<string, { count: number; totalKg: number }>();
    for (const truck of fleet) {
      map.set(truck.id, {
        count: truck.rolls.length,
        totalKg: truck.rolls.reduce((sum, r) => sum + (r.weight_kg ?? 0), 0),
      });
    }
    return map;
  }, [fleet]);

  /* ── Constraint Check ── */

  const checkConstraints = useCallback(
    (rollId: string, targetTruckId: string): ConstraintResult => {
      const truck = trucks.find((t) => t.id === targetTruckId);
      if (!truck)
        return {
          allowed: false,
          reason: 'Xe không tồn tại',
        };

      const roll = availableRolls.find((r) => r.id === rollId);
      if (!roll)
        return {
          allowed: false,
          reason: 'Cuộn không tồn tại',
        };

      // [Khắc nghiệt 1] - Không cho phép bốc cuộn rác (Grade C) lên xe gây sai lệch trọng lượng
      if (rollToGrade(roll) === 'C') {
        return {
          allowed: false,
          reason: 'Cuộn Grade C: Mất thông tin trọng lượng! Vui lòng cân lại.',
        };
      }

      const truckRolls = fleet.find((t) => t.id === targetTruckId)?.rolls || [];

      // [Khắc nghiệt 2] - Strict Material: 1 Xe Tải chỉ chở duy nhất 1 chất liệu để tránh giao nhầm kiện
      if (truckRolls.length > 0) {
        const anchorFabricType = truckRolls[0]?.fabric_type;
        if (anchorFabricType && roll.fabric_type !== anchorFabricType) {
          return {
            allowed: false,
            reason: `Chặn ghép lô: Mâu thuẫn chất liệu. Xe ${truck.plate} đang chuyên chở lô ${anchorFabricType}.`,
          };
        }
      }

      // Rule 3: Capacity check
      const currentCount = truckRolls.length;
      if (currentCount >= truck.maxSlots) {
        return {
          allowed: false,
          reason: `Xe ${truck.plate} đã đầy (${truck.maxSlots} cuộn)`,
        };
      }

      // Rule 4: Weight check
      const currentWeight = truckRolls.reduce(
        (sum, r) => sum + (r.weight_kg ?? 0),
        0,
      );
      const rollWeight = roll.weight_kg ?? 0;
      if (currentWeight + rollWeight > truck.maxWeightKg) {
        return {
          allowed: false,
          reason: `Vượt quá tải trọng của xe ${truck.plate} (${truck.maxWeightKg} kg)`,
        };
      }

      // Rule 5: Reserved roll cannot be moved
      if (roll.status === 'reserved') {
        return {
          allowed: false,
          reason: 'Cuộn này đã bị khóa (reserved)',
        };
      }

      return { allowed: true };
    },
    [trucks, fleet, availableRolls],
  );

  /* ── Move Action (called by both Drag-End and Tap-to-Move) ── */

  const moveRollToTruck = useCallback(
    (rollId: string, targetTruckId: string): boolean => {
      const result = checkConstraints(rollId, targetTruckId);
      if (!result.allowed) {
        return false;
      }

      setAssignments((prev) => {
        const next = new Map(prev);
        next.set(rollId, targetTruckId);
        return next;
      });

      return true;
    },
    [checkConstraints],
  );

  /* ── Return to Pool ── */

  const returnToPool = useCallback((rollId: string) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      next.delete(rollId);
      return next;
    });
  }, []);

  /* ── Handle onMoveComplete from TacticalBoard ── */

  const handleMoveComplete = useCallback(
    (entityId: string, targetBayId: string) => {
      if (targetBayId === 'pool') {
        returnToPool(entityId);
      } else {
        moveRollToTruck(entityId, targetBayId);
      }
    },
    [moveRollToTruck, returnToPool],
  );

  /* ── Auto-Optimize Fleet (Tự động xếp xe) ── */
  const autoOptimizeFleet = useCallback(() => {
    setAssignments((prev) => {
      const nextMap = new Map(prev);

      // Lấy danh sách cuộn chưa phân công, không bị khoá, ưu tiên xếp cuộn nặng nhất trước (First Fit Decreasing)
      // Loại bỏ các cuộn bị báo lỗi Grade C hoặc bị khoá (dành cho tối ưu hoá)
      const rollsToAssign = availableRolls
        .filter(
          (r) =>
            !prev.has(r.id) &&
            r.status !== 'reserved' &&
            rollToGrade(r) !== 'C',
        )
        .sort((a, b) => (b.weight_kg ?? 0) - (a.weight_kg ?? 0));

      if (rollsToAssign.length === 0) {
        toast('Không có cuộn tiêu chuẩn nào khả dụng để tự xếp.', {
          icon: 'ℹ️',
        });
        return prev;
      }

      // Theo dõi sức chứa tạm thời của từng xe để tính toán nội suy (không đợi re-render)
      const truckStates = trucks.map((truck) => {
        const assignedRolls = availableRolls.filter(
          (r) => prev.get(r.id) === truck.id,
        );
        return {
          ...truck,
          currentCount: assignedRolls.length,
          currentWeight: assignedRolls.reduce(
            (sum, r) => sum + (r.weight_kg ?? 0),
            0,
          ),
          firstFabricType:
            assignedRolls.length > 0 ? assignedRolls[0]?.fabric_type : null,
        };
      });

      let assignedCount = 0;

      for (const roll of rollsToAssign) {
        const rollWeight = roll.weight_kg ?? 0;

        // Bắt xe đầu tiên thỏa mãn toán học + Rule Khắc Nghiệt (Strict Material)
        const targetTruck = truckStates.find((t) => {
          if (t.currentCount + 1 > t.maxSlots) return false;
          if (t.currentWeight + rollWeight > t.maxWeightKg) return false;
          if (t.firstFabricType && t.firstFabricType !== roll.fabric_type)
            return false;
          return true;
        });

        if (targetTruck) {
          nextMap.set(roll.id, targetTruck.id);
          targetTruck.currentCount += 1;
          targetTruck.currentWeight += rollWeight;
          if (!targetTruck.firstFabricType) {
            targetTruck.firstFabricType = roll.fabric_type;
          }
          assignedCount += 1;
        }
      }

      if (assignedCount > 0) {
        toast.success(
          `Thuật toán đã xếp thành công ${assignedCount} cuộn vải!`,
        );
        return nextMap;
      } else {
        toast('Sức chứa của đoàn xe không đủ để nhét thêm cuộn nào.', {
          icon: '⚠️',
        });
        return prev;
      }
    });
  }, [availableRolls, trucks]);

  /* ── Bulk Commit / Chốt lệnh ── */

  const [isCommitting, setIsCommitting] = useState(false);
  const createShipment = useCreateShipment();

  const commitDispatch = useCallback(
    async (orderId: string, customerId: string) => {
      // Tìm các xe có được gán cuộn vải
      const activeTrucks = fleet.filter((truck) => truck.rolls.length > 0);
      if (activeTrucks.length === 0) {
        toast.error('Chưa có xe nào được phân công tải trọng.');
        return;
      }

      setIsCommitting(true);
      let successCount = 0;

      try {
        // Thực thi quá trình đăng ký tạo chuyến xe hàng loạt sang API thực
        for (const truck of activeTrucks) {
          const payload: ShipmentsFormValues = {
            ...shipmentsDefaultValues,
            shipmentNumber: '',
            orderId,
            customerId,
            shipmentDate: new Date().toISOString().slice(0, 10),
            deliveryStaffId: truck.id,
            vehicleInfo: truck.plate,
            items: truck.rolls.map((roll) => ({
              finishedRollId: roll.id,
              fabricType: roll.fabric_type,
              quantity: roll.weight_kg || roll.length_m || 0,
            })),
          };

          await createShipment.mutateAsync(payload);
          successCount++;
        }

        toast.success(
          `Đã chốt phát lệnh thành công ${successCount} chuyến xe!`,
          {
            duration: 4000,
            icon: '🚀',
          },
        );

        // Clear the board (Reset Assignments) sau khi xuất kho thành công
        setAssignments(new Map());
      } catch (e) {
        toast.error('Có lỗi xảy ra trong lúc phát lệnh. Xin thử lại.');
      } finally {
        setIsCommitting(false);
      }
    },
    [fleet, createShipment],
  );

  return {
    unassignedRolls,
    fleet,
    truckStats,
    assignments,
    isCommitting,
    rollToGrade,
    moveRollToTruck,
    returnToPool,
    handleMoveComplete,
    checkConstraints,
    commitDispatch,
    autoOptimizeFleet,
  };
}
