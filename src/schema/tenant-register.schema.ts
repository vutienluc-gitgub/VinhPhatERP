import { z } from 'zod';

/**
 * Schema dang ky workspace moi tren vinhphat.app
 */
export const tenantRegisterSchema = z
  .object({
    companyName: z
      .string()
      .min(2, 'Ten cong ty it nhat 2 ky tu')
      .max(100, 'Ten cong ty toi da 100 ky tu'),
    slug: z
      .string()
      .min(3, 'Subdomain it nhat 3 ky tu')
      .max(50, 'Subdomain toi da 50 ky tu')
      .regex(
        /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
        'Chi dung chu thuong, so va dau "-". Khong bat dau/ket thuc bang "-"',
      ),
    email: z.string().email('Email khong hop le'),
    password: z.string().min(6, 'Mat khau it nhat 6 ky tu'),
    confirmPassword: z.string(),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mat khau xac nhan khong khop',
    path: ['confirmPassword'],
  });

export type TenantRegisterFormValues = z.infer<typeof tenantRegisterSchema>;

export const tenantRegisterDefaults: TenantRegisterFormValues = {
  companyName: '',
  slug: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
};
