import { z } from 'zod';

export const tenantRegisterSchema = z.object({
  companyName: z.string().min(1, 'Vui lòng nhập tên công ty / xưởng dệt'),
  tenantSlug: z.string().min(3, 'Mã định danh ít nhất 3 ký tự'),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên quản trị viên'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(8, 'Số điện thoại không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: z.string(),
  plan: z.string().default('pro'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export const tenantRegisterDefaults = {
  companyName: '',
  tenantSlug: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  plan: 'pro',
};
