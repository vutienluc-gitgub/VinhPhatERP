import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import {
  usePortalAccount,
  useCreatePortalAccount,
  useUpdatePortalAccountStatus,
} from '@/application/crm';
import { useConfirm } from '@/shared/hooks/useConfirm';

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
  const { confirm } = useConfirm();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loading = createMutation.isPending || updateStatusMutation.isPending;

  function handleCreate() {
    if (!email || password.length < 8) return;
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
          toast.error(
            err instanceof Error
              ? err.message
              : (String(err) ?? 'Tạo tài khoản thất bại.'),
          );
        },
      },
    );
  }

  async function handleDeactivate() {
    if (!account) return;

    const confirmed = await confirm({
      title: 'Vô hiệu hóa tài khoản',
      message: `Bạn có chắc chắn muốn vô hiệu hóa tài khoản Portal của ${customerName}?`,
      confirmLabel: 'Vô hiệu hóa',
      cancelLabel: 'Hủy',
      variant: 'danger',
    });
    if (!confirmed) return;

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
          toast.error(err instanceof Error ? err.message : String(err));
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
          toast.error(err instanceof Error ? err.message : String(err));
        },
      },
    );
  }

  if (isFetching || account === undefined) {
    return (
      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 min-h-[90px] flex items-center justify-center">
        <p className="text-xs text-slate-400 italic">
          Đang kiểm tra tài khoản Portal…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-3.5 space-y-3.5 border border-slate-200 bg-slate-50 h-full min-h-[90px] flex flex-col justify-between">
      {/* Header/Status Badge */}
      {account !== null && (
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-mono text-slate-500 truncate max-w-[140px] md:max-w-[180px]">
            {account.email}
          </span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-[20px] flex items-center gap-1.5 ${
              account.is_active
                ? 'bg-[#16a34a]/10 text-[#16a34a]'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block ${
                account.is_active ? 'bg-[#16a34a]' : 'bg-slate-400'
              }`}
            />
            {account.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center">
        {account === null ? (
          <>
            {!showForm ? (
              <div className="flex flex-col gap-2">
                <p className="text-[12px] text-slate-500 italic">
                  Khách hàng chưa có tài khoản Portal.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="btn-secondary btn-sm text-[12px] w-fit font-bold"
                >
                  + Tạo tài khoản
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input h-9 text-xs"
                    placeholder="khachhang@email.com"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input h-9 text-xs"
                    placeholder="Tối thiểu 8 ký tự"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="primary"
                    className="btn-sm text-[12px] font-bold"
                    type="button"
                    disabled={loading || !email || password.length < 8}
                    onClick={handleCreate}
                  >
                    {loading ? 'Đang tạo…' : 'Xác nhận'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary btn-sm text-[12px]"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-end pt-1">
            {account.is_active ? (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={loading}
                className={`text-[12px] font-bold text-[#dc2626] bg-[#dc2626]/[0.06] border border-[#dc2626]/20 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[#dc2626]/10 transition-all ${
                  loading ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {loading ? 'Đang xử lý…' : '⊘ Vô hiệu hóa tài khoản'}
              </button>
            ) : (
              <Button
                variant="secondary"
                className="btn-sm text-[12px] font-bold"
                onClick={handleReactivate}
                disabled={loading}
              >
                {loading ? 'Đang xử lý…' : '↺ Kích hoạt lại'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
