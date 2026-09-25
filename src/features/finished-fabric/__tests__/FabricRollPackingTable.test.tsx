import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { FabricRollPackingTable } from '@/features/finished-fabric/components/FabricRollPackingTable';

const mockRolls: FabricRollPackingItem[] = [
  {
    id: 'roll-1',
    roll_code: 'VP-MT-01',
    roll_sequence: 1,
    weight_kg: 23.5,
    fabric_type: 'Vảy cá',
    color_name: 'Muối Tiêu',
    grade: 'grade_a',
    checked: true,
  },
  {
    id: 'roll-2',
    roll_code: 'VP-MT-02',
    roll_sequence: 2,
    weight_kg: 24.5,
    fabric_type: 'Vảy cá',
    color_name: 'Muối Tiêu',
    grade: 'grade_a',
    checked: false,
  },
];

describe('FabricRollPackingTable component', () => {
  it('renders empty state when rolls array is empty', () => {
    render(<FabricRollPackingTable rolls={[]} />);
    expect(
      screen.getByText('Chưa có cây vải nào trong bảng kê'),
    ).toBeInTheDocument();
  });

  it('renders summary statistics and roll items', () => {
    render(<FabricRollPackingTable rolls={mockRolls} title="Bảng kê test" />);

    expect(screen.getByText('Bảng kê test')).toBeInTheDocument();
    expect(screen.getByText('2 cây')).toBeInTheDocument();
    expect(screen.getAllByText('48').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('VP-MT-01')).toBeInTheDocument();
    expect(screen.getByText('VP-MT-02')).toBeInTheDocument();
  });

  it('triggers onPrint callback when print button is clicked', () => {
    const handlePrint = vi.fn();
    render(<FabricRollPackingTable rolls={mockRolls} onPrint={handlePrint} />);

    const printBtn = screen.getByText('In bảng kê');
    fireEvent.click(printBtn);
    expect(handlePrint).toHaveBeenCalledTimes(1);
  });

  it('toggles view mode from grid to table view', () => {
    render(<FabricRollPackingTable rolls={mockRolls} defaultViewMode="grid" />);

    const tableModeBtn = screen.getByTitle('Xem bảng chi tiết');
    fireEvent.click(tableModeBtn);

    // In table view, table headers are visible
    expect(screen.getByText('Khổ (inch)')).toBeInTheDocument();
  });
});
