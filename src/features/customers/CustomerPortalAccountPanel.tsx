import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import {
  usePortalAccount,
  useCreatePortalAccount,
  useUpdatePortalAccountStatus,
} from '@/application/crm';

interface Props {
  customerId: string;
  customerName: string;
}

export function CustomerPortalAccountPanel({
  customerId,
  customerName,
}: Props) {
  const { data: account, isLoading: isFetching } = usePortalAccount(customerId);
  const createMutation = useCreatePortalAccount(customerId);
  const updateStatusMutation = useUpdatePortalAccountStatus(customerId);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loading = createMutation.isPending || updateStatusMutation.isPending;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(
      {
        customer_id: customerId,
        full_name: customerName,
        email,
        password,
      },
      {
        onSuccess: () => {
          toast.success(`Tài khoản Portal đã được tạo cho ${customerName}.`);
          setShowForm(false);
          setEmail('');
          setPassword('');
        },
        onError: (err) => {
          toast.error((err as Error).message ?? 'Tạo tài khoản thất bại.');
        },
      },
    );
  }

  function handleDeactivate() {
    if (!account) return;
    if (!confirm(`Vô hiệu hóa tài khoản Portal của ${customerName}?`)) return;

    updateStatusMutation.mutate(
      {
        id: account.id,
        isActive: false,
      },
      {
        onSuccess: () => {
          toast.success('Tài khoản đã bị vô hiệu hóa.');
        },
        onError: (err) => {
          toast.error((err as Error).message);
        },
      },
    );
  }

  function handleReactivate() {
    if (!account) return;

    updateStatusMutation.mutate(
      {
        id: account.id,
        isActive: true,
      },
      {
        onSuccess: () => {
          toast.success('Tài khoản đã được kích hoạt lại.');
        },
        onError: (err) => {
          toast.error((err as Error).message);
        },
      },
    );
  }

  if (isFetching || account === undefined) {
    return (
      <div className="border border-border rounded-lg p-4">
        <p className="text-sm text-muted">Đang kiểm tra tài khoản Portal…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4 space-y-3 border border-border bg-[var(--surface-subtle)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          Tài khoản Customer Portal
        </span>
        {account !== null && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-[20px] flex items-center gap-1 ${account.is_active ? 'bg-[#16a34a]/10 text-[#16a34a]' : 'bg-gray-500/12 text-muted-foreground'}`}
          >
            <span
              className={`w-[6px] h-[6px] rounded-full inline-block ${account.is_active ? 'bg-[#16a34a]' : 'bg-[#9ca3af]'}`}
            />
            {account.is_active ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
          </span>
        )}
      </div>

      {account === null ? (
        <>
          <p className="text-[13px] text-muted-foreground">
            Khách hàng chưa có tài khoản Portal.
          </p>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn-secondary btn-sm text-[12px]"
            >
              + Tạo tài khoản
            </button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="filter-field">
                <label className="filter-label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                  placeholder="khachhang@email.com"
                />
              </div>
              <div className="filter-field">
                <label className="filter-label">Mật khẩu tạm thời</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field-input"
                  placeholder="Tối thiểu 8 ký tự"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="btn-sm text-[12px]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Đang tạo…' : 'Tạo tài khoản'}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary btn-sm text-[12px]"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div>
          {account.is_active ? (
            <button
              onClick={handleDeactivate}
              disabled={loading}
              className={`text-[12px] font-semibold text-[#dc2626] bg-[#dc2626]/[0.06] border border-[#dc2626]/20 rounded-md px-3 py-[5px] cursor-pointer ${loading ? 'opacity-50' : 'opacity-100'}`}
            >
              {loading ? 'Đang xử lý…' : '⊘ Vô hiệu hóa tài khoản'}
            </button>
          ) : (
            <Button
              variant="secondary"
              className="btn-sm text-[12px]"
              onClick={handleReactivate}
              disabled={loading}
            >
              {loading ? 'Đang xử lý…' : '↺ Kích hoạt lại'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
