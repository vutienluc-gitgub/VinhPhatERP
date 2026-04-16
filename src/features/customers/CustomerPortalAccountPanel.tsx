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
    <div
      className="rounded-lg p-4 space-y-3"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--surface-subtle)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--muted)',
          }}
        >
          Tài khoản Customer Portal
        </span>
        {account !== null && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
              background: account.is_active
                ? 'rgba(22,163,74,0.1)'
                : 'rgba(107,114,128,0.12)',
              color: account.is_active ? '#16a34a' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: account.is_active ? '#16a34a' : '#9ca3af',
                display: 'inline-block',
              }}
            />
            {account.is_active ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
          </span>
        )}
      </div>

      {account === null ? (
        <>
          <p
            style={{
              fontSize: 13,
              color: 'var(--muted)',
            }}
          >
            Khách hàng chưa có tài khoản Portal.
          </p>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn-secondary btn-sm"
              style={{ fontSize: 12 }}
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
                  className="btn-sm"
                  type="submit"
                  disabled={loading}
                  style={{ fontSize: 12 }}
                >
                  {loading ? 'Đang tạo…' : 'Tạo tài khoản'}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary btn-sm"
                  style={{ fontSize: 12 }}
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
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#dc2626',
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 6,
                padding: '5px 12px',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Đang xử lý…' : '⊘ Vô hiệu hóa tài khoản'}
            </button>
          ) : (
            <Button
              variant="secondary"
              className="btn-sm"
              onClick={handleReactivate}
              disabled={loading}
              style={{ fontSize: 12 }}
            >
              {loading ? 'Đang xử lý…' : '↺ Kích hoạt lại'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
