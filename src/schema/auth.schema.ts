import { z } from 'zod';

// ── Auth Schemas ──
export const authSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
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
