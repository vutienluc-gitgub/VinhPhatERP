import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useCreateCustomer,
  useNextCustomerCode,
  useUpdateCustomer,
  useEmployees,
} from '@/application/crm';
import { useAuth } from '@/shared/hooks/useAuth';
import type { Customer } from '@/domain/crm/customers.types';

import { CustomerForm } from './CustomerForm';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>,
  );
}

// Mock dependencies
vi.mock('@/application/crm', () => ({
  useCreateCustomer: vi.fn(),
  useUpdateCustomer: vi.fn(),
  useNextCustomerCode: vi.fn(),
  useEmployees: vi.fn(),
}));

vi.mock('@/application/crm/useCustomerGroups', () => ({
  useCustomerGroupList: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCustomerGroupMembers: vi
    .fn()
    .mockReturnValue({ data: [], isLoading: false }),
}));

vi.mock('@/api/customer-groups.api', () => ({
  saveCustomerGroupsForCustomer: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('./CustomerPortalAccountPanel', () => ({
  CustomerPortalAccountPanel: () => <div data-testid="portal-panel" />,
}));

vi.mock('./CustomerTimeline', () => ({
  CustomerTimeline: () => <div data-testid="customer-timeline" />,
}));

describe('CustomerForm', () => {
  const mockCreateMutateAsync = vi.fn();
  const mockUpdateMutateAsync = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useCreateCustomer as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
      error: null,
    });

    (useUpdateCustomer as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
      error: null,
    });

    (
      useNextCustomerCode as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      data: 'KH-001',
    });

    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      profile: {
        role: 'admin',
        employee_id: 'emp-123',
      },
    });

    (useEmployees as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
    });
  });

  const mockCustomer = {
    id: 'cust-1',
    code: 'KH-002',
    name: 'Công ty TNHH Test',
    phone: '0901234567',
    email: 'test@test.com',
    address: '123 Test St',
    tax_code: '0312345678',
    contact_person: 'Mr Test',
    source: 'referral',
    notes: 'Test notes',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  } as unknown as Customer;

  it('renders create form correctly and defaults code', async () => {
    renderWithClient(<CustomerForm customer={null} onClose={mockOnClose} />);

    expect(screen.getByLabelText(/Tên khách hàng/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Mã khách hàng/i)).toHaveValue('KH-001');
    });

    // Portal panel should not be visible in create mode
    expect(screen.queryByTestId('portal-panel')).not.toBeInTheDocument();
  });

  it('renders edit form correctly with customer data', () => {
    renderWithClient(
      <CustomerForm customer={mockCustomer} onClose={mockOnClose} />,
    );

    expect(screen.getByLabelText(/Mã khách hàng/i)).toHaveValue('KH-002');
    expect(screen.getByLabelText(/Tên khách hàng/i)).toHaveValue(
      'Công ty TNHH Test',
    );
    expect(screen.getByLabelText(/Số điện thoại/i)).toHaveValue('0901234567');
    expect(screen.getByLabelText(/Email/i)).toHaveValue('test@test.com');
    expect(screen.getByLabelText(/Địa chỉ/i)).toHaveValue('123 Test St');
    expect(screen.getByLabelText(/Mã số thuế/i)).toHaveValue('0312345678');
    expect(screen.getByLabelText(/Người liên hệ/i)).toHaveValue('Mr Test');
    expect(screen.getByLabelText(/Ghi chú/i)).toHaveValue('Test notes');

    // Portal panel should be visible in edit mode
    expect(screen.getByTestId('portal-panel')).toBeInTheDocument();
  });

  it('calls create mutation on valid submit', async () => {
    renderWithClient(<CustomerForm customer={null} onClose={mockOnClose} />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Tên khách hàng/i), {
      target: { value: 'Khách hàng mới' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Tạo mới/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Khách hàng mới',
          code: 'KH-001',
          source: 'other',
          status: 'active',
        }),
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Tạo khách hàng mới thành công');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls update mutation on valid edit submit', async () => {
    renderWithClient(
      <CustomerForm customer={mockCustomer} onClose={mockOnClose} />,
    );

    // Edit a field
    fireEvent.change(screen.getByLabelText(/Tên khách hàng/i), {
      target: { value: 'Tên đã cập nhật' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Cập nhật/i }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cust-1',
          values: expect.objectContaining({
            name: 'Tên đã cập nhật',
            code: 'KH-002',
          }),
        }),
      );
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Cập nhật khách hàng thành công',
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays validation errors on invalid submit', async () => {
    renderWithClient(<CustomerForm customer={null} onClose={mockOnClose} />);

    // Submit without filling name
    fireEvent.click(screen.getByRole('button', { name: /Tạo mới/i }));

    await waitFor(() => {
      expect(screen.getByText(/Tên tối thiểu 2 ký tự/i)).toBeInTheDocument();
    });

    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it('displays error message from mutation', () => {
    (useCreateCustomer as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
      isPending: false,
      error: new Error(
        'Khách hàng đã tồn tại (trùng Mã, Email hoặc SDT). Vui lòng kiểm tra lại.',
      ),
    });

    renderWithClient(<CustomerForm customer={null} onClose={mockOnClose} />);

    expect(screen.getByText(/Lỗi: Khách hàng đã tồn tại/i)).toBeInTheDocument();
  });
});
