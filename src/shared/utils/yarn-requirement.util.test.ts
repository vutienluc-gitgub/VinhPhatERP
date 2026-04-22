import { describe, it, expect } from 'vitest';

import {
  calcTotalBomRatio,
  calcTotalRequiredKg,
  calcTotalAllocatedKg,
} from './yarn-requirement.util';

describe('yarn-requirement.util', () => {
  describe('calcTotalBomRatio', () => {
    it('should correctly sum bom_ratio_pct for an array of rows', () => {
      // Arrange
      const mockRows = [
        { bom_ratio_pct: 60, required_kg: 0 },
        { bom_ratio_pct: 40, required_kg: 0 },
      ];

      // Act
      const result = calcTotalBomRatio(mockRows);

      // Assert
      expect(result).toBe(100);
    });

    it('should handle empty arrays', () => {
      // Arrange
      const mockRows: { bom_ratio_pct: number; required_kg: number }[] = [];

      // Act
      const result = calcTotalBomRatio(mockRows);

      // Assert
      expect(result).toBe(0);
    });

    it('should ignore invalid or missing number fields safely', () => {
      // Arrange
      const mockRows = [
        { bom_ratio_pct: 50, required_kg: 0 },
        { bom_ratio_pct: null as unknown as number, required_kg: 0 }, // Using unknown bypass per Rule 3.2 for intentional edge cases
        { bom_ratio_pct: undefined as unknown as number, required_kg: 0 },
      ];

      // Act
      const result = calcTotalBomRatio(mockRows);

      // Assert
      expect(result).toBe(50);
    });
  });

  describe('calcTotalRequiredKg', () => {
    it('should correctly sum required_kg', () => {
      // Arrange
      const mockRows = [
        { bom_ratio_pct: 60, required_kg: 150.5 },
        { bom_ratio_pct: 40, required_kg: 49.5 },
      ];

      // Act
      const result = calcTotalRequiredKg(mockRows);

      // Assert
      expect(result).toBe(200);
    });

    it('should return 0 for empty array', () => {
      // Act
      const result = calcTotalRequiredKg([]);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('calcTotalAllocatedKg', () => {
    it('should correctly sum allocated_kg', () => {
      // Arrange
      const mockRows = [
        { allocated_kg: 100 },
        { allocated_kg: 250.75 },
        { allocated_kg: 0 },
      ];

      // Act
      const result = calcTotalAllocatedKg(mockRows);

      // Assert
      expect(result).toBe(350.75);
    });

    it('should return 0 for empty array', () => {
      // Act
      const result = calcTotalAllocatedKg([]);

      // Assert
      expect(result).toBe(0);
    });
  });
});
