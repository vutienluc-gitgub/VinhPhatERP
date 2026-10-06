import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { QuotationAcceptSheet } from '@/features/customer-portal/quotations/QuotationAcceptSheet';

describe('QuotationAcceptSheet', () => {
  beforeEach(() => {
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.setAttribute('id', 'modal-root');
      document.body.appendChild(modalRoot);
    }
  });

  it('renders quotation details and keeps confirm disabled until terms are accepted', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuotationAcceptSheet
        open={true}
        onClose={handleClose}
        quotationNumber="BG-2026-001"
        totalAmount={5000000}
        onConfirm={handleConfirm}
        isProcessing={false}
      />,
    );

    expect(screen.getByText(/BG-2026-001/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /xác nhận/i });
    expect(confirmButton).toBeDisabled();

    // Check the terms checkbox
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    expect(confirmButton).not.toBeDisabled();
    fireEvent.click(confirmButton);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
