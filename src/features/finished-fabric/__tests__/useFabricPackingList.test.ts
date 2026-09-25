import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { useFabricPackingList } from '@/features/finished-fabric/hooks/useFabricPackingList';

const sampleRolls: FabricRollPackingItem[] = [
  {
    id: 'r1',
    roll_code: 'VP-MT-01',
    roll_sequence: 1,
    weight_kg: 22.5,
    fabric_type: 'Vảy cá',
    color_name: 'Muối Tiêu',
    grade: 'grade_a',
    checked: false,
  },
  {
    id: 'r2',
    roll_code: 'VP-MT-02',
    roll_sequence: 2,
    weight_kg: 24.5,
    fabric_type: 'Vảy cá',
    color_name: 'Muối Tiêu',
    grade: 'grade_a',
    checked: false,
  },
  {
    id: 'r3',
    roll_code: 'VP-XD-01',
    roll_sequence: 3,
    weight_kg: 20.0,
    fabric_type: 'Vảy cá',
    color_name: 'Xanh Đen',
    grade: 'grade_b',
    checked: false,
  },
];

describe('useFabricPackingList hook', () => {
  it('initializes summary and groups correctly', () => {
    const { result } = renderHook(() =>
      useFabricPackingList({
        initialRolls: sampleRolls,
        defaultViewMode: 'grid',
      }),
    );

    expect(result.current.viewMode).toBe('grid');
    expect(result.current.overallSummary.total_rolls).toBe(3);
    expect(result.current.overallSummary.total_weight_kg).toBe(67.0);
    expect(result.current.availableColors).toEqual(['Muối Tiêu', 'Xanh Đen']);
  });

  it('scans a roll code, updating check-off status and notification', () => {
    const { result } = renderHook(() =>
      useFabricPackingList({ initialRolls: sampleRolls }),
    );

    act(() => {
      result.current.handleScan('VP-MT-01');
    });

    expect(result.current.overallSummary.total_checked_rolls).toBe(1);
    expect(result.current.overallSummary.total_checked_weight_kg).toBe(22.5);
    expect(result.current.scanNotification?.type).toBe('success');

    // Scanning already checked roll
    act(() => {
      result.current.handleScan('VP-MT-01');
    });
    expect(result.current.scanNotification?.type).toBe('warning');
  });

  it('resets check-off states', () => {
    const { result } = renderHook(() =>
      useFabricPackingList({ initialRolls: sampleRolls }),
    );

    act(() => {
      result.current.handleScan('VP-MT-01');
    });
    expect(result.current.overallSummary.total_checked_rolls).toBe(1);

    act(() => {
      result.current.handleResetCheckoff();
    });
    expect(result.current.overallSummary.total_checked_rolls).toBe(0);
  });

  it('filters by color and search query', () => {
    const { result } = renderHook(() =>
      useFabricPackingList({ initialRolls: sampleRolls }),
    );

    act(() => {
      result.current.setSelectedColor('Xanh Đen');
    });
    expect(result.current.filteredRolls).toHaveLength(1);
    expect(result.current.filteredRolls[0]?.roll_code).toBe('VP-XD-01');

    act(() => {
      result.current.setSelectedColor('all');
      result.current.setSearchQuery('MT-02');
    });
    expect(result.current.filteredRolls).toHaveLength(1);
    expect(result.current.filteredRolls[0]?.roll_code).toBe('VP-MT-02');
  });

  it('toggles view mode between grid and table', () => {
    const { result } = renderHook(() =>
      useFabricPackingList({
        initialRolls: sampleRolls,
        defaultViewMode: 'grid',
      }),
    );

    expect(result.current.viewMode).toBe('grid');
    act(() => {
      result.current.setViewMode('table');
    });
    expect(result.current.viewMode).toBe('table');
  });
});
