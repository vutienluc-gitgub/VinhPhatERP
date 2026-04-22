import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PaymentsPage } from './PaymentsPage';
import type { Expense, PaymentAccount } from './types';

// Mock subcomponents to isolate testing to PaymentsPage's tab switching & state management
vi.mock('./CashFlowDashboard', () => ({
  CashFlowDashboard: () => <div data-testid="cashflow-dashboard" />,
}));
vi.mock('./PaymentList', () => ({
  PaymentList: () => <div data-testid="payment-list" />,
}));
vi.mock('./DebtSummary', () => ({
  DebtSummary: () => <div data-testid="debt-summary" />,
}));
vi.mock('./SupplierDebtSummary', () => ({
  SupplierDebtSummary: () => <div data-testid="supplier-debt-summary" />,
}));

vi.mock('./ExpenseList', () => ({
  ExpenseList: ({
    onEdit,
    onNew,
  }: {
    onEdit: (e: Expense) => void;
    onNew: () => void;
  }) => (
    <div data-testid="expense-list">
      <button data-testid="btn-new-expense" onClick={onNew}>
        New Expense
      </button>
      <button
        data-testid="btn-edit-expense"
        onClick={() => onEdit({ id: 'exp-1' } as unknown as Expense)}
      >
        Edit Expense
      </button>
    </div>
  ),
}));
vi.mock('./ExpenseForm', () => ({
  ExpenseForm: ({
    expense,
    onClose,
  }: {
    expense: Expense | null;
    onClose: () => void;
  }) => (
    <div data-testid="expense-form">
      <span data-testid="expense-form-data">
        {expense ? expense.id : 'new'}
      </span>
      <button data-testid="btn-close-expense" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('./AccountList', () => ({
  AccountList: ({
    onEdit,
    onNew,
  }: {
    onEdit: (a: PaymentAccount) => void;
    onNew: () => void;
  }) => (
    <div data-testid="account-list">
      <button data-testid="btn-new-account" onClick={onNew}>
        New Account
      </button>
      <button
        data-testid="btn-edit-account"
        onClick={() => onEdit({ id: 'acc-1' } as unknown as PaymentAccount)}
      >
        Edit Account
      </button>
    </div>
  ),
}));
vi.mock('./AccountForm', () => ({
  AccountForm: ({
    account,
    onClose,
  }: {
    account: PaymentAccount | null;
    onClose: () => void;
  }) => (
    <div data-testid="account-form">
      <span data-testid="account-form-data">
        {account ? account.id : 'new'}
      </span>
      <button data-testid="btn-close-account" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

describe('PaymentsPage', () => {
  it('renders cashflow dashboard by default', () => {
    render(<PaymentsPage />);
    expect(screen.getByTestId('cashflow-dashboard')).toBeInTheDocument();
  });

  it('switches to payments tab', () => {
    render(<PaymentsPage />);
    fireEvent.click(screen.getByText('Phiếu thu'));
    expect(screen.getByTestId('payment-list')).toBeInTheDocument();
  });

  it('switches to expenses tab and manages form state', () => {
    render(<PaymentsPage />);
    fireEvent.click(screen.getByText('Phiếu chi'));
    expect(screen.getByTestId('expense-list')).toBeInTheDocument();

    // Open new form
    fireEvent.click(screen.getByTestId('btn-new-expense'));
    expect(screen.getByTestId('expense-form')).toBeInTheDocument();
    expect(screen.getByTestId('expense-form-data')).toHaveTextContent('new');

    // Close form
    fireEvent.click(screen.getByTestId('btn-close-expense'));
    expect(screen.queryByTestId('expense-form')).not.toBeInTheDocument();

    // Open edit form
    fireEvent.click(screen.getByTestId('btn-edit-expense'));
    expect(screen.getByTestId('expense-form')).toBeInTheDocument();
    expect(screen.getByTestId('expense-form-data')).toHaveTextContent('exp-1');
  });

  it('switches to customer-debt tab', () => {
    render(<PaymentsPage />);
    fireEvent.click(screen.getByText('Công nợ KH'));
    expect(screen.getByTestId('debt-summary')).toBeInTheDocument();
  });

  it('switches to supplier-debt tab', () => {
    render(<PaymentsPage />);
    fireEvent.click(screen.getByText('Công nợ NCC'));
    expect(screen.getByTestId('supplier-debt-summary')).toBeInTheDocument();
  });

  it('switches to accounts tab and manages form state', () => {
    render(<PaymentsPage />);
    fireEvent.click(screen.getByText('Tài khoản'));
    expect(screen.getByTestId('account-list')).toBeInTheDocument();

    // Open new form
    fireEvent.click(screen.getByTestId('btn-new-account'));
    expect(screen.getByTestId('account-form')).toBeInTheDocument();
    expect(screen.getByTestId('account-form-data')).toHaveTextContent('new');

    // Close form
    fireEvent.click(screen.getByTestId('btn-close-account'));
    expect(screen.queryByTestId('account-form')).not.toBeInTheDocument();

    // Open edit form
    fireEvent.click(screen.getByTestId('btn-edit-account'));
    expect(screen.getByTestId('account-form')).toBeInTheDocument();
    expect(screen.getByTestId('account-form-data')).toHaveTextContent('acc-1');
  });
});
