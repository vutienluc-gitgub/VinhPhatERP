import { useCallback, useEffect, useState } from 'react';

import { Icon } from '@/shared/components';
import {
  usePasskeyAuth,
  type PasskeyCredentialInfo,
} from '@/shared/hooks/usePasskeyAuth';

export function PasskeySettingsCard() {
  const { isSupported, registerPasskey, listCredentials, deleteCredential } =
    usePasskeyAuth();

  const [credentials, setCredentials] = useState<PasskeyCredentialInfo[]>([]);
  const [isLoadingCreds, setIsLoadingCreds] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [friendlyName, setFriendlyName] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const loadCredentials = useCallback(async () => {
    try {
      setIsLoadingCreds(true);
      const list = await listCredentials();
      setCredentials(list);
    } catch {
      // Bỏ qua lỗi tải danh sách nếu mạng chậm
    } finally {
      setIsLoadingCreds(false);
    }
  }, [listCredentials]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      setFeedback(null);
      const name = friendlyName.trim() || 'Thiết bị bảo mật';
      await registerPasskey(name);
      setFriendlyName('');
      setFeedback({
        type: 'success',
        msg: 'Đăng ký khóa Passkey thành công! Từ nay bạn có thể đăng nhập bằng sinh trắc học.',
      });
      await loadCredentials();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        msg:
          err instanceof Error
            ? err.message
            : 'Không thể đăng ký khóa bảo mật.',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn thu hồi khóa "${name}" không?`)) {
      return;
    }
    try {
      setFeedback(null);
      await deleteCredential(id);
      setFeedback({
        type: 'success',
        msg: `Đã thu hồi khóa "${name}" thành công.`,
      });
      await loadCredentials();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Xóa khóa bảo mật thất bại.',
      });
    }
  };

  return (
    <div className="panel-card bg-surface border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon name="Fingerprint" size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Sinh trắc học & Khóa Passkey
          </h2>
          <p className="text-sm text-muted-foreground">
            Đăng nhập không cần mật khẩu bằng Face ID, Touch ID hoặc Windows
            Hello.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-sm font-medium my-4 ${
            feedback.type === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-danger/10 text-danger border border-danger/20'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {isSupported ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-surface/50 border border-border/60 rounded-xl">
            <input
              type="text"
              placeholder="Tên thiết bị (VD: iPhone 15, Laptop xưởng may...)"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              disabled={isRegistering}
              className="flex-1 px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={handleRegister}
              disabled={isRegistering}
              className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isRegistering ? (
                <Icon name="LoaderCircle" size={16} className="animate-spin" />
              ) : (
                <Icon name="Plus" size={16} />
              )}
              <span>
                {isRegistering
                  ? 'Đang chạm xác thực...'
                  : 'Đăng ký thiết bị này'}
              </span>
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
              Thiết bị đã liên kết ({credentials.length})
            </h3>

            {isLoadingCreds ? (
              <div className="space-y-2">
                <div className="h-14 bg-surface/40 animate-pulse rounded-xl" />
                <div className="h-14 bg-surface/40 animate-pulse rounded-xl" />
              </div>
            ) : credentials.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border rounded-xl bg-surface/20">
                <Icon
                  name="ShieldCheck"
                  size={32}
                  className="mx-auto text-muted-foreground/60 mb-2"
                />
                <p className="text-sm text-muted-foreground font-medium">
                  Chưa có khóa Passkey nào được đăng ký cho tài khoản này.
                </p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Nhập tên thiết bị ở trên và nhấn "Đăng ký thiết bị này" để bật
                  đăng nhập 1 chạm.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-surface hover:bg-surface/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon name="Key" size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {cred.friendly_name || 'Khóa bảo mật'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Tạo ngày:{' '}
                          {new Date(cred.created_at).toLocaleDateString(
                            'vi-VN',
                          )}
                          {cred.last_used_at &&
                            ` · Dùng lần cuối: ${new Date(
                              cred.last_used_at,
                            ).toLocaleDateString('vi-VN')}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(cred.id, cred.friendly_name)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Thu hồi khóa này"
                    >
                      Thu hồi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 p-4 bg-warning/10 border border-warning/20 rounded-xl text-sm text-warning-foreground">
          Thiết bị hoặc trình duyệt hiện tại không hỗ trợ WebAuthn / Passkey.
          Vui lòng sử dụng trình duyệt hiện đại (Chrome, Safari, Edge) có bật
          bảo mật sinh trắc học.
        </div>
      )}
    </div>
  );
}
