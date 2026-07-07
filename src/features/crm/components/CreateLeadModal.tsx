import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Button } from '@/shared/components/Button';
import { Combobox } from '@/shared/components/Combobox';
import { Icon } from '@/shared/components/Icon';
import {
  useCheckDuplicateContact,
  useCreateLead,
} from '@/application/crm/useCrm';
import { useDebouncedValue } from '@/shared/components/filter-bar';

const leadSchema = z.object({
  type: z.enum(['RFQ', 'SAMPLE', 'CONTACT']),
  customer_name: z.string().min(2, 'Tên khách hàng phải có ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  company_name: z.string().optional(),
  source: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface CreateLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (id: string) => void;
}

const TYPE_OPTIONS = [
  { value: 'CONTACT', label: 'Liên hệ chung' },
  { value: 'RFQ', label: 'Yêu cầu Báo giá (RFQ)' },
  { value: 'SAMPLE', label: 'Yêu cầu Gửi mẫu' },
];

const SOURCE_OPTIONS = [
  { value: 'DIRECT', label: 'Trực tiếp' },
  { value: 'ZALO', label: 'Zalo' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'REFERRAL', label: 'Giới thiệu' },
];

export function CreateLeadModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateLeadModalProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      type: 'CONTACT',
      customer_name: '',
      phone: '',
      email: '',
      company_name: '',
      source: 'DIRECT',
    },
  });

  const { mutateAsync: createLead } = useCreateLead();

  const phoneVal = watch('phone');
  const emailVal = watch('email');
  const debouncedPhone = useDebouncedValue(phoneVal, 500);
  const debouncedEmail = useDebouncedValue(emailVal, 500);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const { data: duplicates, isFetching: isChecking } = useCheckDuplicateContact(
    {
      phone: debouncedPhone?.length >= 10 ? debouncedPhone : undefined,
      email: debouncedEmail?.includes('@') ? debouncedEmail : undefined,
    },
  );

  useEffect(() => {
    if (!open) {
      reset();
      setSelectedCustomerId(null);
    }
  }, [open, reset]);

  const hasDuplicates =
    duplicates &&
    (duplicates.customers.length > 0 || duplicates.leads.length > 0);

  const onSubmit = async (values: LeadFormValues) => {
    try {
      const res = await createLead({
        ...values,
        email: values.email || undefined,
        customer_id: selectedCustomerId || undefined,
      });
      onOpenChange(false);
      onSuccess?.(res.id);
      toast.success('Tạo Lead thành công');
    } catch (error) {
      console.error('[CreateLeadError]', error);
      toast.error(
        'Không thể tạo Lead: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  };

  return (
    <AdaptiveSheet
      open={open}
      onClose={() => onOpenChange(false)}
      title="Thêm Yêu cầu (Lead) mới"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>Loại yêu cầu</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={TYPE_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="form-field">
            <label>Nguồn khách hàng</label>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={SOURCE_OPTIONS}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>
              Số điện thoại <span className="field-required">*</span>
            </label>
            <div className="relative">
              <input
                className={`field-input w-full ${errors.phone ? 'is-error' : ''}`}
                placeholder="090..."
                {...register('phone')}
              />
              {isChecking && (
                <Icon
                  name="Loader2"
                  className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted"
                />
              )}
            </div>
            {errors.phone && (
              <p className="field-error">{errors.phone.message}</p>
            )}
          </div>

          <div className="form-field">
            <label>Email</label>
            <div className="relative">
              <input
                className={`field-input w-full ${errors.email ? 'is-error' : ''}`}
                type="email"
                placeholder="abc@gmail.com"
                {...register('email')}
              />
              {isChecking && (
                <Icon
                  name="Loader2"
                  className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted"
                />
              )}
            </div>
            {errors.email && (
              <p className="field-error">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Smart Duplicate Detection Alert */}
        {hasDuplicates && !selectedCustomerId && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Icon
                name="AlertCircle"
                className="h-5 w-5 text-amber-600 mt-0.5 shrink-0"
              />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-800">
                  Phát hiện dữ liệu trùng lặp
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Thông tin này đã tồn tại trong hệ thống. Bạn có muốn liên kết
                  với khách hàng cũ không?
                </p>

                <div className="mt-4 space-y-2">
                  {duplicates.customers.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          name="Building2"
                          className="h-4 w-4 text-amber-600"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {c.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Khách hàng chính thức
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setValue('customer_name', c.name);
                          setValue('company_name', c.name);
                        }}
                      >
                        Liên kết
                      </Button>
                    </div>
                  ))}
                  {duplicates.leads.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-amber-100"
                    >
                      <Icon
                        name="UserCircle2"
                        className="h-4 w-4 text-amber-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {l.customer_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Lead tiềm năng (chưa chuyển đổi)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedCustomerId && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Building2" className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-sm font-bold text-teal-800">
                  Đã chọn liên kết khách hàng
                </p>
                <p className="text-xs text-teal-700">
                  Lead này sẽ được gắn vào hồ sơ khách hàng đã chọn.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSelectedCustomerId(null)}
            >
              Hủy
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="form-field">
            <label>
              Tên người liên hệ <span className="field-required">*</span>
            </label>
            <input
              className={`field-input w-full ${errors.customer_name ? 'is-error' : ''}`}
              placeholder="Nguyễn Văn A"
              {...register('customer_name')}
            />
            {errors.customer_name && (
              <p className="field-error">{errors.customer_name.message}</p>
            )}
          </div>

          <div className="form-field">
            <label>Tên công ty</label>
            <input
              className="field-input w-full"
              placeholder="Công ty ABC"
              {...register('company_name')}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {selectedCustomerId ? 'Tạo Lead & Liên kết' : 'Tạo Lead mới'}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
