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
      <p className="text-sm text-gray-400">Đang kiểm tra tài khoản Portal…</p>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-gray-900">
        Tài khoản Customer Portal
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      {account === null ? (
        <>
          <p className="text-sm text-gray-500">
            Khách hàng chưa có tài khoản Portal.
          </p>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              + Tạo tài khoản
            </button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  placeholder="khachhang@email.com"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Mật khẩu tạm thời
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  placeholder="Tối thiểu 8 ký tự"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Đang tạo…' : 'Tạo tài khoản'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                account.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {account.is_active ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
            </span>
          </div>
          {account.is_active ? (
            <button
              onClick={handleDeactivate}
              disabled={loading}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Vô hiệu hóa tài khoản
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              disabled={loading}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              Kích hoạt lại
            </button>
          )}
        </div>
      )}
    </div>
  );
}
