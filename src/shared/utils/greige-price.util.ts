import {
  calculatePriceInputSchema,
  type CalculatePriceInput,
  type CalculatePriceResult,
} from '@/schema/greige-price.schema';

/**
 * Tính toán giá thành vải mộc (Greige Fabric).
 *
 * Hàm này tuân thủ Clean Architecture (Pure function):
 * - Không truy cập UI, Không gọi API.
 * - Đầu vào luôn được validate chặt chẽ (sẽ throw lỗi nếu sai).
 * - Có khả năng mở rộng thông qua thuộc tính `additionalCosts`.
 *
 * @param input CalculatePriceInput
 * @returns CalculatePriceResult
 */
export function calculateGreigeFabricPrice(
  input: CalculatePriceInput,
): CalculatePriceResult {
  // 1. Strict Validation using Zod
  const data = calculatePriceInputSchema.parse(input);

  const {
    weightKg,
    unitPricePerKg,
    processingCost,
    transportCost,
    wastePercent,
    profitMarginPercent,
    additionalCosts,
  } = data;

  // 2. Base cost calculation
  // Hao hụt (waste) được tính dựa trên khối lượng (weight).
  // Theo business-rules.md, baseCost (Tiền sợi) phải TÍNH CẢ HAO HỤT.
  const effectiveWeightKg = weightKg * (1 + wastePercent / 100);
  const baseCost = Math.round(effectiveWeightKg * unitPricePerKg);

  // wasteCost chỉ dùng để report (không cộng vào totalCost nữa vì baseCost đã bao gồm)
  const wasteCost = Math.round(
    weightKg * (wastePercent / 100) * unitPricePerKg,
  );

  // 3. Additional costs aggregation
  // Tích hợp các chi phí phụ và chi phí động
  let additionalCostTotal = processingCost + transportCost;

  const additionalCostBreakdown = [
    ...(processingCost > 0
      ? [
          {
            key: 'processing',
            label: 'Chi phí gia công',
            amount: processingCost,
          },
        ]
      : []),
    ...(transportCost > 0
      ? [
          {
            key: 'transport',
            label: 'Chi phí vận chuyển',
            amount: transportCost,
          },
        ]
      : []),
    ...additionalCosts,
  ];

  for (const item of additionalCosts) {
    additionalCostTotal += item.amount;
  }

  // 4. Total Cost Calculation (tuân thủ chống Double Count)
  const totalCost = Math.round(baseCost + additionalCostTotal);

  // 5. Final Selling Price Calculation
  // Lợi nhuận (profit margin) được áp dụng SAU khi đã cộng tất cả các khoản phí
  const finalPrice = Math.round(totalCost * (1 + profitMarginPercent / 100));

  // 6. Price Per Meter Estimation
  // Để tính được số mét chính xác từ số kg và khổ vải (width), hệ thống cần biết thêm
  // trọng lượng định mức (GSM - Grams per Square Meter).
  // Vì chưa có thông số này ở input, mục này tạm trả về null.
  const pricePerMeter = null;

  return {
    baseCost,
    wasteCost,
    effectiveWeightKg,
    additionalCostTotal,
    additionalCostBreakdown,
    totalCost,
    finalPrice,
    pricePerMeter,
  };
}
