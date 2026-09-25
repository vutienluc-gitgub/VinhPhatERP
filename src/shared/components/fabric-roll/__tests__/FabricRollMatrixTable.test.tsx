import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import { FabricRollMatrixTable } from '@/shared/components/fabric-roll/FabricRollMatrixTable';

const mockRolls: FabricRollPackingItem[] = [
  {
    id: 'roll-1',
    roll_code: 'VP-MT-01',
    roll_sequence: 1,
    weight_kg: 22.8,
    grade: 'grade_a',
    checked: true,
  },
  {
    id: 'roll-2',
    roll_code: 'VP-MT-02',
    roll_sequence: 2,
    weight_kg: 24.2,
    grade: 'grade_a',
    checked: false,
  },
  {
    id: 'roll-3',
    roll_code: 'VP-MT-03',
    roll_sequence: 3,
    weight_kg: 25.0,
    grade: 'grade_b',
    checked: false,
  },
];

describe('FabricRollMatrixTable component', () => {
  it('renders empty message when rolls is empty', () => {
    render(<FabricRollMatrixTable rolls={[]} />);
    expect(screen.getByText('Không có dữ liệu cây vải.')).toBeInTheDocument();
  });

  it('renders matrix headers and column numbers', () => {
    render(<FabricRollMatrixTable rolls={mockRolls} />);

    expect(screen.getByText('STT CÂY')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('CỘNG (KG)')).toBeInTheDocument();
  });

  it('renders roll weights, codes, and subtotal correctly', () => {
    render(<FabricRollMatrixTable rolls={mockRolls} />);

    expect(screen.getByText('22.8')).toBeInTheDocument();
    expect(screen.getByText('24.2')).toBeInTheDocument();
    expect(screen.getByText('25.0')).toBeInTheDocument();

    expect(screen.getByText('VP-MT-01')).toBeInTheDocument();
    expect(screen.getByText('VP-MT-02')).toBeInTheDocument();
    expect(screen.getByText('VP-MT-03')).toBeInTheDocument();

    // Row subtotal: 22.8 + 24.2 + 25.0 = 72.0
    expect(screen.getAllByText('72.0').length).toBeGreaterThanOrEqual(1);

    // Footer summary
    expect(screen.getByText('3 CÂY')).toBeInTheDocument();
    expect(screen.getByText('72.0 kg')).toBeInTheDocument();
  });

  it('triggers onToggleCheck callback when cell is clicked', () => {
    const handleToggleCheck = vi.fn();
    render(
      <FabricRollMatrixTable
        rolls={mockRolls}
        onToggleCheck={handleToggleCheck}
      />,
    );

    const cellWeight = screen.getByText('22.8');
    fireEvent.click(cellWeight.closest('td')!);

    expect(handleToggleCheck).toHaveBeenCalledTimes(1);
    expect(handleToggleCheck).toHaveBeenCalledWith(mockRolls[0]);
  });

  it('triggers onToggleCheck on Enter key press for accessibility', () => {
    const handleToggleCheck = vi.fn();
    render(
      <FabricRollMatrixTable
        rolls={mockRolls}
        onToggleCheck={handleToggleCheck}
      />,
    );

    const cellWeight = screen.getByText('22.8');
    const tdElement = cellWeight.closest('td')!;
    fireEvent.keyDown(tdElement, { key: 'Enter', code: 'Enter' });

    expect(handleToggleCheck).toHaveBeenCalledTimes(1);
    expect(handleToggleCheck).toHaveBeenCalledWith(mockRolls[0]);
  });

  it('renders compact mode without roll code subtitles for A5 print', () => {
    render(<FabricRollMatrixTable rolls={mockRolls} compact={true} />);

    expect(screen.getByText('22.8')).toBeInTheDocument();
    expect(screen.queryByText('VP-MT-01')).not.toBeInTheDocument();
  });
});
