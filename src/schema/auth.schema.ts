import { z } from 'zod';

export const CUSTOMER_PORTAL_EMAIL_DOMAIN = '@portal.vinhphaterp.vn';

/**
 * Checks if a string represents a valid customer code.
 * Rules:
 * - Must not contain '@'
 * - 2 to 30 characters
 * - Starts with an alphanumeric character
 * - Contains only alphanumeric characters, dots, underscores, or hyphens (no spaces)
 */
export function isCustomerCode(identifier: string): boolean {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,29}$/.test(trimmed);
}

/**
 * Normalizes user input (email or customer code) into a GoTrue-compatible email.
 * If input contains '@', it is treated as a standard email and converted to lowercase.
 * Otherwise, it is treated as a customer code (e.g. 'KH-001') and mapped to
 * '<code_lowercase>@portal.vinhphaterp.vn'.
 */
export function normalizeAuthIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  return `${trimmed.toLowerCase()}${CUSTOMER_PORTAL_EMAIL_DOMAIN}`;
}

// ── Auth Schemas ──
export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email hoặc mã khách hàng')
    .refine(
      (val) => {
        if (val.includes('@')) {
          return z.string().email().safeParse(val).success;
        }
        return isCustomerCode(val);
      },
      {
        message: 'Email hoặc mã khách hàng không hợp lệ',
      },
    ),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
  rememberMe: z.boolean().default(true),
});

export type AuthFormValues = z.infer<typeof authSchema>;

export const authDefaultValues: AuthFormValues = {
  email: '',
  password: '',
  rememberMe: true,
};

// ── Register Schema ──
export const registerSchema = z
  .object({
    email: z.string().trim().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
    confirmPassword: z.string().min(8, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const registerDefaultValues: RegisterFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
};
// ── Forgot Password Schema ──
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// ── Reset Password Schema ──
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên'),
    confirmPassword: z.string().min(8, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
