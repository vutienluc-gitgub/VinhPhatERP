import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useStepper } from './useStepper';

describe('useStepper', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useStepper({ totalSteps: 3 }));

    expect(result.current.currentStep).toBe(0);
    expect(result.current.totalSteps).toBe(3);
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.isValidating).toBe(false);
  });

  it('should advance step when validation passes', async () => {
    const mockValidation = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useStepper({
        totalSteps: 3,
        stepValidation: { 0: mockValidation },
      }),
    );

    let success: boolean = false;
    await act(async () => {
      success = await result.current.next();
    });

    expect(success).toBe(true);
    expect(result.current.currentStep).toBe(1);
    expect(mockValidation).toHaveBeenCalledOnce();
  });

  it('should not advance step when validation fails', async () => {
    const mockValidation = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() =>
      useStepper({
        totalSteps: 3,
        stepValidation: { 0: mockValidation },
      }),
    );

    let success: boolean = false;
    await act(async () => {
      success = await result.current.next();
    });

    expect(success).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(mockValidation).toHaveBeenCalledOnce();
  });

  it('should handle async validation correctly', async () => {
    const mockValidation = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 50)),
      );

    const { result } = renderHook(() =>
      useStepper({
        totalSteps: 3,
        stepValidation: { 0: mockValidation },
      }),
    );

    let success: boolean = false;
    await act(async () => {
      success = await result.current.next();
    });

    expect(success).toBe(true);
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.isValidating).toBe(false);
  });

  it('should properly handle validation errors', async () => {
    const mockValidation = vi
      .fn()
      .mockRejectedValue(new Error('Validation error'));
    const { result } = renderHook(() =>
      useStepper({
        totalSteps: 3,
        stepValidation: { 0: mockValidation },
      }),
    );

    let success: boolean = false;
    await act(async () => {
      success = await result.current.next();
    });

    expect(success).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.isValidating).toBe(false);
  });
});
