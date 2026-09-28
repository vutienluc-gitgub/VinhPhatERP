import { useCallback, useEffect, useState } from 'react';

import { AUTH_LABELS, AUTH_MESSAGES } from '@/features/auth/constants';
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
      // Non-blocking in profile view
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
      const name = friendlyName.trim() || AUTH_MESSAGES.passkeyDeviceDefault;
      await registerPasskey(name);
      setFriendlyName('');
      setFeedback({
        type: 'success',
        msg: AUTH_MESSAGES.passkeyRegisterSuccess,
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
        msg:
          err instanceof Error ? err.message : AUTH_MESSAGES.passkeyRevokeError,
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
            Khóa bảo mật Passkey & Sinh trắc học
          </h2>
          <p className="text-xs text-muted-foreground">
            Đăng nhập 1 chạm an toàn không cần mật khẩu bằng Touch ID, Face ID
            hoặc khóa FIDO2.
          </p>
        </div>
      </div>

      {!isSupported && (
        <div className="mt-4 p-3 bg-warning-soft/20 border border-warning/30 rounded-xl flex items-center gap-3 text-warning">
          <Icon name="AlertTriangle" size={18} className="shrink-0" />
          <p className="text-xs">
            Trình duyệt hoặc hệ điều hành của bạn chưa hỗ trợ WebAuthn /
            Passkeys.
          </p>
        </div>
      )}

      {feedback && (
        <div
          className={`mt-4 p-3 rounded-xl flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-success-soft/20 border border-success/30 text-success'
              : 'bg-danger-soft/20 border border-danger/30 text-danger'
          }`}
        >
          <span>{feedback.msg}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Đăng ký Passkey mới */}
      <div className="mt-6 pt-5 border-t border-border">
        <label
          htmlFor="passkey-name-input"
          className="block text-xs font-semibold text-muted-foreground uppercase mb-2"
        >
          Thêm thiết bị mới
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="passkey-name-input"
            type="text"
            value={friendlyName}
            onChange={(e) => setFriendlyName(e.target.value)}
            placeholder={AUTH_LABELS.passkeyDevicePlaceholder}
            disabled={!isSupported || isRegistering}
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            type="button"
            onClick={handleRegister}
            disabled={!isSupported || isRegistering}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isRegistering ? (
              <Icon name="LoaderCircle" size={16} className="animate-spin" />
            ) : (
              <Icon name="Plus" size={16} />
            )}
            <span>{isRegistering ? 'Đang tạo khóa…' : 'Đăng ký thiết bị'}</span>
          </button>
        </div>
      </div>

      {/* Danh sách Passkeys đã đăng ký */}
      <div className="mt-6 pt-5 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
          Thiết bị đã liên kết ({credentials.length})
        </h3>

        {isLoadingCreds ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Đang tải danh sách khóa bảo mật…
          </div>
        ) : credentials.length === 0 ? (
          <div className="p-4 bg-muted/10 border border-border/60 rounded-xl text-center text-xs text-muted-foreground">
            Chưa có khóa bảo mật nào được đăng ký. Hãy thêm thiết bị đầu tiên để
            bật đăng nhập không cần mật khẩu.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {credentials.map((cred) => (
              <li
                key={cred.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground">
                    <Icon name="KeyRound" size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {cred.friendly_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tạo ngày{' '}
                      {new Date(cred.created_at).toLocaleDateString('vi-VN')}
                      {cred.last_used_at &&
                        ` • Dùng gần nhất ${new Date(
                          cred.last_used_at,
                        ).toLocaleDateString('vi-VN')}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(cred.id, cred.friendly_name)}
                  className="px-2.5 py-1 text-xs text-danger hover:bg-danger-soft/20 rounded-lg transition-colors cursor-pointer"
                  title="Thu hồi khóa này"
                >
                  Thu hồi
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
