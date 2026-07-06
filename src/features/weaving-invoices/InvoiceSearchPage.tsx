import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Icon } from '@/shared/components';
import { Turnstile } from '@/shared/components/Turnstile';

// 1. Bộ lọc chuẩn hóa làm sạch mã tra cứu
function sanitizeLookupCode(code: string): string {
  return (
    code
      .trim()
      .toUpperCase()
      // Chuẩn hóa Unicode tổ hợp để tách dấu
      .normalize('NFD')
      // Loại bỏ toàn bộ các dấu tiếng Việt
      .replace(/[\u0300-\u036f]/g, '')
      // Loại bỏ mọi ký tự đặc biệt, khoảng trắng, gạch ngang, dấu chấm...
      .replace(/[^A-Z0-9]/g, '')
      // Chỉ lấy tối đa 10 ký tự của mã tra cứu chuẩn
      .slice(0, 10)
  );
}

const searchSchema = z.object({
  lookupCode: z
    .string()
    .trim()
    .min(1, 'Mã tra cứu không được để trống')
    .min(5, 'Mã tra cứu quá ngắn')
    .max(20, 'Mã tra cứu quá dài'),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export function InvoiceSearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Xác định cấu hình bảo mật
  const isProd = import.meta.env.PROD;
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const hasTurnstileKey = !!siteKey && siteKey.trim() !== '';
  const useTurnstile = isProd || hasTurnstileKey;
  const configError = isProd && !hasTurnstileKey;

  // State quản lý Captcha
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, result: 0 });
  const [mathAnswer, setMathAnswer] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Focus ô nhập khi mở trang
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Sinh Math Captcha nếu không dùng Turnstile
  useEffect(() => {
    if (!useTurnstile) {
      generateNewCaptcha();
    }
  }, [useTurnstile]);

  function generateNewCaptcha() {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setCaptcha({
      num1,
      num2,
      result: num1 + num2,
    });
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      lookupCode: '',
    },
  });

  const onSubmit = (values: SearchFormValues) => {
    setValidationError(null);

    // Chặn submit nếu có lỗi cấu hình Turnstile ở Production
    if (configError) {
      setValidationError(
        'Không thể thực hiện tra cứu do lỗi cấu hình Turnstile.',
      );
      return;
    }

    // Làm sạch và chuẩn hóa mã tra cứu
    const cleanCode = sanitizeLookupCode(values.lookupCode);
    if (cleanCode.length < 5) {
      setValidationError('Mã tra cứu không hợp lệ sau khi chuẩn hóa.');
      return;
    }

    // Kiểm tra Turnstile ở Prod hoặc Dev có key
    if (useTurnstile) {
      if (!turnstileToken) {
        setValidationError('Vui lòng hoàn thành xác thực Turnstile.');
        return;
      }
    } else {
      // Kiểm tra Math Captcha ở Dev không có key
      const userAnswer = parseInt(mathAnswer, 10);
      if (isNaN(userAnswer) || userAnswer !== captcha.result) {
        setValidationError('Kết quả phép tính xác thực không chính xác.');
        generateNewCaptcha();
        setMathAnswer('');
        return;
      }
    }

    // Redirect sang trang hóa đơn chi tiết
    navigate(`/tra-cuu/${cleanCode}`);
  };

  const { ref: hookFormRef, ...restRegister } = register('lookupCode');

  return (
    <div className="min-h-screen bg-[#f0f5fb] flex flex-col justify-between font-sans">
      {/* Top Accent Color Bar */}
      <div className="h-2 bg-gradient-to-r from-[#0f3460] via-[#1a6bb5] to-[#3da5e0]" />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#dce6f0] overflow-hidden transition-all duration-300 hover:shadow-2xl">
          {/* Header Card Brand */}
          <div className="bg-[#0f3460] px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#1a6bb5]/10 rounded-full blur-2xl" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[#3da5e0]/10 rounded-full blur-2xl" />

            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md mb-4 text-white text-3xl">
              📄
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide uppercase">
              VinhPhat ERP
            </h1>
            <p className="text-[#8eb8e5] text-xs font-semibold tracking-widest uppercase mt-1">
              Cổng Tra Cứu Hóa Đơn Điện Tử
            </p>
          </div>

          {/* Form Area */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-8 py-8 flex flex-col gap-6"
          >
            <div className="text-center mb-2">
              <p className="text-sm text-[var(--text-secondary)]">
                Nhập mã tra cứu nhận được trên hóa đơn hoặc phiếu giao hàng để
                xem thông tin chi tiết.
              </p>
            </div>

            {/* Cảnh báo cấu hình Turnstile nghiêm trọng trên Prod */}
            {configError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold space-y-1">
                <p>⚠️ CẢNH BÁO BẢO MẬT HỆ THỐNG</p>
                <p className="font-normal text-red-600">
                  Hệ thống bảo mật Turnstile chưa được cấu hình Key trên môi
                  trường Production. Vui lòng liên hệ bộ phận Kỹ thuật để thiết
                  lập biến môi trường.
                </p>
              </div>
            )}

            {/* Input Lookup Code */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="lookup-code-input"
                className="text-xs font-bold text-[#0f3460] uppercase tracking-wider"
              >
                Mã tra cứu hóa đơn
              </label>
              <div className="relative">
                <input
                  id="lookup-code-input"
                  type="text"
                  placeholder="Nhập mã (Ví dụ: L5FPS6K67J)"
                  disabled={configError}
                  aria-label="Mã tra cứu hóa đơn dệt gia công"
                  aria-required="true"
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-[var(--text-primary)] font-semibold text-lg uppercase tracking-wider placeholder:lowercase placeholder:text-sm placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#1a6bb5] focus:bg-white transition-all ${
                    errors.lookupCode
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-[#dce6f0]'
                  }`}
                  ref={(e) => {
                    hookFormRef(e);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (inputRef as any).current = e;
                  }}
                  {...restRegister}
                />
                <span className="absolute right-3.5 top-3.5 text-slate-400">
                  <Icon name="Search" size={20} />
                </span>
              </div>
              {errors.lookupCode && (
                <span className="text-xs font-semibold text-red-600">
                  {errors.lookupCode.message}
                </span>
              )}
            </div>

            {/* Kiểm soát xác thực: Turnstile (Mặc định) hoặc Math Captcha (Fallback) */}
            {useTurnstile ? (
              !configError && (
                <div className="flex flex-col gap-1.5 items-center justify-center">
                  <span className="text-xs font-bold text-[#0f3460] uppercase tracking-wider align-self-start w-full">
                    Xác minh bảo mật (Cloudflare)
                  </span>
                  <Turnstile
                    onVerify={(token) => {
                      setTurnstileToken(token);
                      setValidationError(null);
                    }}
                    options={{ theme: 'light', size: 'normal' }}
                  />
                </div>
              )
            ) : (
              /* Math Captcha Fallcheck cho dev */
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="captcha-answer-input"
                  className="text-xs font-bold text-[#0f3460] uppercase tracking-wider"
                >
                  Phép tính xác thực (Nhà phát triển)
                </label>
                <div className="flex gap-3">
                  <div className="bg-[#f0f5fb] border border-[#dce6f0] rounded-xl px-4 py-3 font-bold text-lg text-[#0f3460] select-none flex items-center justify-center min-w-[100px]">
                    {captcha.num1} + {captcha.num2} =
                  </div>
                  <input
                    id="captcha-answer-input"
                    type="number"
                    placeholder="?"
                    aria-label={`Kết quả phép tính ${captcha.num1} cộng ${captcha.num2}`}
                    aria-required="true"
                    className="flex-1 px-4 py-3 rounded-xl border border-[#dce6f0] bg-slate-50 text-[var(--text-primary)] font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-[#1a6bb5] focus:bg-white transition-all"
                    value={mathAnswer}
                    onChange={(e) => setMathAnswer(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Error alerts */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting || configError || (useTurnstile && !turnstileToken)
              }
              aria-label="Thực hiện tra cứu hóa đơn"
              className="w-full bg-[#0f3460] hover:bg-[#15467e] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tìm kiếm...</span>
                </>
              ) : (
                <>
                  <span>Tra cứu hóa đơn</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center py-6 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
        Hệ Thống Dệt May Vĩnh Phát — VinhPhat ERP © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
