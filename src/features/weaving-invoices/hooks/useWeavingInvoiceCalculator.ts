import type { WeavingRollFormValues } from '@/schema/weaving-invoice.schema';

/**
 * Hàm hỗ trợ kiểm tra xem một cuộn vải đã được quét (nhập liệu hợp lệ) chưa.
 */
export function checkIsRollScanned(
  roll: Partial<WeavingRollFormValues> | undefined | null,
): boolean {
  if (!roll) return false;
  const rollNumber = roll.roll_number;
  const parsedWeight = parseFloat(String(roll.weight_kg));
  return !!rollNumber && !isNaN(parsedWeight) && parsedWeight > 0;
}

/**
 * Hook đóng gói toàn bộ Business Logic tính toán tổng khối lượng, tổng tiền
 * và đếm số cuộn đã quét, để đưa ra khỏi UI Component.
 */
export function useWeavingInvoiceCalculator(
  rolls: Partial<WeavingRollFormValues>[],
  unitPricePerKg: number,
) {
  const scannedCount = rolls.filter(checkIsRollScanned).length;

  const totalKg = rolls.reduce((sum, roll) => {
    return sum + (parseFloat(String(roll.weight_kg)) || 0);
  }, 0);

  const totalAmount = totalKg * unitPricePerKg;

  return {
    scannedCount,
    totalKg,
    totalAmount,
  };
}
