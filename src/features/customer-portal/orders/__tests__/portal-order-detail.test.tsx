import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { PortalOrderPaymentSection } from '@/features/customer-portal/orders/PortalOrderPaymentSection';
import { PortalOrderPackingList } from '@/features/customer-portal/orders/PortalOrderPackingList';
import type {
  FabricRollBreakdownItem,
  OrderPaymentSummary,
} from '@/domain/portal/types';

describe('PortalOrderPaymentSection', () => {
  const mockPaymentSummary: OrderPaymentSummary = {
    subtotal: 63070800,
    vatRate: 0.08,
    vatAmount: 5045664,
    grandTotal: 68116464,
    paidAmount: 0,
    remainingBalance: 68116464,
    unitPricePerKg: 78000,
    totalWeightKg: 808.6,
  };

  it('renders payment amounts correctly including VAT 8% and grand total', () => {
    render(
      <PortalOrderPaymentSection
        paymentSummary={mockPaymentSummary}
        orderNumber="PO-20260420-TEST"
        customerCode="KH-010"
      />,
    );

    // Subtotal
    expect(screen.getByText('63.070.800 đ')).toBeInTheDocument();
    // VAT 8%
    expect(screen.getByText('+5.045.664 đ')).toBeInTheDocument();
    // Grand Total and Remaining Balance (both 68.116.464 đ)
    const totalElements = screen.getAllByText('68.116.464 đ');
    expect(totalElements.length).toBeGreaterThanOrEqual(1);
    // In words text
    expect(screen.getByText(/đồng/)).toBeInTheDocument();
  });

  it('renders VietQR image and bank details when remaining balance > 0', () => {
    render(
      <PortalOrderPaymentSection
        paymentSummary={mockPaymentSummary}
        orderNumber="PO-20260420-TEST"
        customerCode="KH-010"
      />,
    );

    const qrImage = screen.getByAltText('VietQR Payment');
    expect(qrImage).toBeInTheDocument();
    expect(qrImage.getAttribute('src')).toContain('img.vietqr.io');
    expect(screen.getByText('80000346931')).toBeInTheDocument();
  });

  it('renders fully paid badge when balance is 0', () => {
    const paidSummary: OrderPaymentSummary = {
      ...mockPaymentSummary,
      paidAmount: 68116464,
      remainingBalance: 0,
    };

    render(
      <PortalOrderPaymentSection
        paymentSummary={paidSummary}
        orderNumber="PO-20260420-TEST"
        customerCode="KH-010"
      />,
    );

    expect(screen.getByText('Đã thanh toán đủ')).toBeInTheDocument();
  });
});

describe('PortalOrderPackingList', () => {
  const mockRolls: FabricRollBreakdownItem[] = [
    {
      id: 'roll-1',
      roll_code: 'VP-01',
      weight_kg: 23.3,
      length_m: null,
      display_index: 1,
    },
    {
      id: 'roll-2',
      roll_code: 'VP-02',
      weight_kg: 23.2,
      length_m: null,
      display_index: 2,
    },
    {
      id: 'roll-3',
      roll_code: 'VP-03',
      weight_kg: 23.0,
      length_m: null,
      display_index: 3,
    },
  ];

  it('renders packing list with roll codes and weights', () => {
    render(<PortalOrderPackingList rolls={mockRolls} />);

    expect(screen.getByText('VP-01')).toBeInTheDocument();
    expect(screen.getByText('VP-02')).toBeInTheDocument();
    expect(screen.getByText('VP-03')).toBeInTheDocument();
    expect(screen.getByText('23.3')).toBeInTheDocument();
    expect(screen.getByText('23.2')).toBeInTheDocument();
    expect(screen.getByText('23.0')).toBeInTheDocument();
    expect(screen.getAllByText(/3\s*cây/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/69\.5\s*kg/).length).toBeGreaterThanOrEqual(1);
  });

  it('returns null when rolls list is empty', () => {
    const { container } = render(<PortalOrderPackingList rolls={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
