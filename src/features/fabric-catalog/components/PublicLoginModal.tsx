import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useAuth } from '@/shared/hooks/useAuth';
import { Turnstile } from '@/shared/components/Turnstile';
import { Button, Icon } from '@/shared/components';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface PublicLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublicLoginModal({ isOpen, onClose }: PublicLoginModalProps) {
  const { signIn } = useAuth();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setServerError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    if (!captchaToken) {
      setServerError('Vui lòng hoàn thành xác thực bảo mật.');
      return;
    }

    setIsLoading(true);
    setServerError(null);

    try {
      const { error } = await signIn(email.trim(), password, captchaToken);
      if (error) {
        setServerError(vietnameseAuthError(error.message));
        window.turnstile?.reset();
        setCaptchaToken(null);
        return;
      }

      toast.success('Đăng nhập thành công!');

      // Invalidates the fabric-catalog queries to reload pricing & stock info
      await queryClient.invalidateQueries({ queryKey: ['fabric-catalog'] });

      onClose();
    } catch (_err) {
      setServerError('Đã xảy ra lỗi không mong muốn.');
      window.turnstile?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Icon name="Lock" className="w-5 h-5 text-primary" />
            {LABELS.loginBtn}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Đăng nhập tài khoản B2B
            </h2>
            <p className="text-gray-500 text-sm">
              Nhập email và mật khẩu của bạn để xem bảng giá sỉ và trạng thái
              kho.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Nhập email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center">
              <p className="text-red-600 text-sm font-medium">{serverError}</p>
            </div>
          )}

          <div className="flex justify-center min-h-[65px] mt-2">
            <Turnstile onVerify={setCaptchaToken} />
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={isLoading || !captchaToken}
            isLoading={isLoading}
            className="mt-2"
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function vietnameseAuthError(message: string): string {
  if (/invalid login credentials/i.test(message))
    return 'Email hoặc mật khẩu không đúng.';
  if (/email not confirmed/i.test(message))
    return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.';
  if (/too many requests/i.test(message))
    return 'Đăng nhập thất bại. Vui lòng thử lại sau.';
  if (/network/i.test(message))
    return 'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng.';
  return message;
}
