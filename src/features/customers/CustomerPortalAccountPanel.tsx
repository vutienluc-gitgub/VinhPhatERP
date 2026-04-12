import { useState } from 'react';

import { supabase } from '@/services/supabase/client';

interface Props {
  customerId: string;
  customerName: string;
}

interface PortalAccount {
  id: string;
  email: string;
  is_active: boolean;
}

export function CustomerPortalAccountPanel({
  customerId,
  customerName,
}: Props) {
  const [account, setAccount] = useState<PortalAccount | null | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Load account status on mount
  useState(() => {
    loadAccount();
  });

  async function loadAccount() {
    const { data } = await supabase
      .from('profiles')
      .select('id, is_active')
      .eq('customer_id', customerId)
      .eq('role', 'customer')
      .maybeSingle();

    if (data) {
      // Get email from auth — not available via profiles directly, show id
      setAccount({
        id: data.id,
        email: '(đã có tài khoản)',
        is_active: data.is_active,
      });
    } else {
      setAccount(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError('Phiên đăng nhập hết hạn.');
      setLoading(false);
      return;
    }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-customer-account`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          password,
          customer_id: customerId,
          full_name: customerName,
        }),
      },
    );

    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json.error?.message ?? 'Tạo tài khoản thất bại.');
    } else {
      setSuccess(`Tài khoản Portal đã được tạo cho ${customerName}.`);
      setShowForm(false);
      setEmail('');
      setPassword('');
      await loadAccount();
    }
    setLoading(false);
  }

  async function handleDeactivate() {
    if (!account) return;
    if (!confirm(`Vô hiệu hóa tài khoản Portal của ${customerName}?`)) return;

    setLoading(true);
    setError(null);

    const { error: err } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', account.id);

    if (err) {
      setError(err.message);
    } else {
      setSuccess('Tài khoản đã bị vô hiệu hóa.');
      await loadAccount();
    }
    setLoading(false);
  }

  async function handleReactivate() {
    if (!account) return;
    setLoading(true);
    setError(null);

    const { error: err } = await supabase
      .from('profiles')
      .update({ is_active: true })
      .eq('id', account.id);

    if (err) {
      setError(err.message);
    } else {
      setSuccess('Tài khoản đã được kích hoạt lại.');
      await loadAccount();
    }
    setLoading(false);
  }

  if (account === undefined) {
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

      {/* Feedback */}
      {error && (
        <div
          style={{
            fontSize: 12,
            color: '#dc2626',
            background: 'rgba(220,38,38,0.06)',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(220,38,38,0.15)',
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            fontSize: 12,
            color: '#16a34a',
            background: 'rgba(22,163,74,0.06)',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(22,163,74,0.15)',
          }}
        >
          {success}
        </div>
      )}

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
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary btn-sm"
                  style={{ fontSize: 12 }}
                >
                  {loading ? 'Đang tạo…' : 'Tạo tài khoản'}
                </button>
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
            <button
              onClick={handleReactivate}
              disabled={loading}
              className="btn-secondary btn-sm"
              style={{ fontSize: 12 }}
            >
              {loading ? 'Đang xử lý…' : '↺ Kích hoạt lại'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
