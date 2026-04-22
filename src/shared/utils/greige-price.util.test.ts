import { describe, it, expect } from 'vitest';

import { calculateGreigeFabricPrice } from './greige-price.util';

describe('calculateGreigeFabricPrice', () => {
  it('should calculate basic price correctly without extra costs or waste', () => {
    const result = calculateGreigeFabricPrice({
      weightKg: 100,
      widthCm: 160,
      unitPricePerKg: 100_000,
      // All other values default to 0
    });

    expect(result.baseCost).toBe(10_000_000);
    expect(result.wasteCost).toBe(0);
    expect(result.additionalCostTotal).toBe(0);
    expect(result.totalCost).toBe(10_000_000);
    expect(result.finalPrice).toBe(10_000_000);
  });

  it('should accurately apply waste, processing, transport, and profit margins', () => {
    // 100kg fabric @ 50,000 VND = 5,000,000 VND
    // Waste: 5% => 250,000 VND
    // Processing: 500,000 VND
    // Transport: 100,000 VND
    // Additional (Dyeing): 1,000,000 VND
    // Profit Margin: 10%
    const result = calculateGreigeFabricPrice({
      weightKg: 100,
      widthCm: 160,
      unitPricePerKg: 50_000,
      processingCost: 500_000,
      transportCost: 100_000,
      wastePercent: 5,
      profitMarginPercent: 10,
      additionalCosts: [
        { key: 'dyeing', label: 'Tiền nhuộm thêm', amount: 1_000_000 },
      ],
    });

    expect(result.baseCost).toBe(5_000_000);
    expect(result.wasteCost).toBe(250_000); // 5% of 5,000,000

    // Total Additional Costs: 500k + 100k + 1M
    expect(result.additionalCostTotal).toBe(1_600_000);

    // Total Cost = 5,000,000 + 250,000 + 1,600,000 = 6,850,000
    expect(result.totalCost).toBe(6_850_000);

    // Final Price = 6,850,000 + 10% profit
    expect(result.finalPrice).toBe(7_535_000);

    // Check breakdown extensibility
    expect(result.additionalCostBreakdown.length).toBe(3);
    expect(result.additionalCostBreakdown[2]?.key).toBe('dyeing');
  });

  it('should throw Zod error when input values are invalid (e.g. negative percentage)', () => {
    expect(() => {
      calculateGreigeFabricPrice({
        weightKg: 100,
        widthCm: 160,
        unitPricePerKg: 50_000,
        wastePercent: -5, // Invalid!
      });
    }).toThrow();
  });
});
