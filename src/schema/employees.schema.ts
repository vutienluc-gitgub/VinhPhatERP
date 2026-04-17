import { z } from 'zod';

export const employeeRoleSchema = z.enum([
  'admin',
  'sales',
  'warehouse',
  'driver',
]);
export type EmployeeRole = z.infer<typeof employeeRoleSchema>;

export const employeeStatusSchema = z.enum(['active', 'inactive']);
export type EmployeeStatus = z.infer<typeof employeeStatusSchema>;

export const employeeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string().min(1, 'Họ tên là bắt buộc'),
  phone: z.string().nullable().optional(),
  role: employeeRoleSchema,
  status: employeeStatusSchema,
  created_at: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;

export const employeeFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên nhân viên'),
  phone: z.string().trim().optional(),
  role: employeeRoleSchema.describe('Vai trò nhân viên'),
  status: employeeStatusSchema.default('active'),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const employeeDefaultValues: EmployeeFormValues = {
  name: '',
  phone: '',
  role: 'warehouse',
  status: 'active',
};
