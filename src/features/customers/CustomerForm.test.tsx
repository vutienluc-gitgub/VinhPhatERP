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
import {
  useCustomerGroupList,
  useCustomerGroupMembers,
} from '@/application/crm/useCustomerGroups';
import { saveCustomerGroupsForCustomer } from '@/api/customer-groups.api';
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
  useCustomerGroupList: vi.fn(),
  useCustomerGroupMembers: vi.fn(),
}));

vi.mock('@/api/customer-groups.api', () => ({
  saveCustomerGroupsForCustomer: vi.fn(),
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
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

  const mockGroups = [
    {
      id: 'grp-1',
      tenant_id: 't-1',
      code: 'MAY',
      name: 'Xưởng may',
      description: null,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'grp-2',
      tenant_id: 't-1',
      code: 'BRAND',
      name: 'Local brand',
      description: null,
      status: 'active',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ];

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

    (
      useCustomerGroupList as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      data: mockGroups,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    (
      useCustomerGroupMembers as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (
      saveCustomerGroupsForCustomer as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(undefined);
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
    expect(screen.getByTestId('portal-panel')).toBeInTheDocument();
  });

  it('calls create mutation and saves groups when groups are selected', async () => {
    mockCreateMutateAsync.mockResolvedValue({ id: 'new-cust-1' });

    renderWithClient(<CustomerForm customer={null} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/Tên khách hàng/i), {
      target: { value: 'Khách hàng mới' },
    });

    // Select group 'Xưởng may'
    fireEvent.click(screen.getByRole('button', { name: /Xưởng may/i }));

    fireEvent.click(screen.getByRole('button', { name: /Tạo mới/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalled();
      expect(saveCustomerGroupsForCustomer).toHaveBeenCalledWith('new-cust-1', [
        'grp-1',
      ]);
    });

    expect(toast.success).toHaveBeenCalledWith('Tạo khách hàng mới thành công');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows warning toast if group save fails during creation (Partial Success)', async () => {
    mockCreateMutateAsync.mockResolvedValue({ id: 'new-cust-1' });
    (
      saveCustomerGroupsForCustomer as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValueOnce(new Error('Network error'));

    renderWithClient(<CustomerForm customer={null} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/Tên khách hàng/i), {
      target: { value: 'Khách hàng mới' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Xưởng may/i }));

    fireEvent.click(screen.getByRole('button', { name: /Tạo mới/i }));

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalled();
      expect(saveCustomerGroupsForCustomer).toHaveBeenCalled();
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('chưa gán được nhóm'),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls update mutation and saves changed groups on edit submit', async () => {
    (
      useCustomerGroupMembers as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      data: ['grp-1'],
      isLoading: false,
    });

    renderWithClient(
      <CustomerForm customer={mockCustomer} onClose={mockOnClose} />,
    );

    // Toggle to add 'Local brand'
    fireEvent.click(screen.getByRole('button', { name: /Local brand/i }));

    fireEvent.click(screen.getByRole('button', { name: /Cập nhật/i }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalled();
      expect(saveCustomerGroupsForCustomer).toHaveBeenCalledWith(
        'cust-1',
        expect.arrayContaining(['grp-1', 'grp-2']),
      );
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Cập nhật khách hàng thành công',
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows warning toast if group update fails during edit submit', async () => {
    (
      useCustomerGroupMembers as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      data: ['grp-1'],
      isLoading: false,
    });
    (
      saveCustomerGroupsForCustomer as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValueOnce(new Error('Network error'));

    renderWithClient(
      <CustomerForm customer={mockCustomer} onClose={mockOnClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Cập nhật/i }));

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalled();
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('chưa gán được nhóm'),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays validation errors on invalid submit', async () => {
    renderWithClient(<CustomerForm customer={null} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Tạo mới/i }));

    await waitFor(() => {
      expect(screen.getByText(/Tên tối thiểu 2 ký tự/i)).toBeInTheDocument();
    });

    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });
});
