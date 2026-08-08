import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { useAuth } from '@/features/auth/AuthProvider';
import { fetchSupplierById, updateSupplier } from '@/api/suppliers.api';
import { Button, Icon, Input } from '@/shared/components';
import { SUPPLIER_PORTAL_LABELS } from '@/features/supplier-portal/supplier-portal.constants';

const TEXT = SUPPLIER_PORTAL_LABELS;

const profileSchema = z.object({
  name: z.string().min(1, 'Tên công ty không được để trống'),
  tax_code: z.string().optional().nullable(),
  email: z
    .string()
    .email('Email không hợp lệ')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function SupplierProfilePage() {
  const { profile } = useAuth();
  const supplierId = profile?.supplier_id;
  const queryClient = useQueryClient();

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier-profile', supplierId],
    queryFn: () => {
      if (!supplierId) throw new Error(TEXT.PROFILE_ERROR_NO_SUPPLIER);
      return fetchSupplierById(supplierId);
    },
    enabled: !!supplierId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      tax_code: '',
      email: '',
      phone: '',
      contact_person: '',
      address: '',
    },
  });

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        tax_code: supplier.tax_code ?? '',
        email: supplier.email ?? '',
        phone: supplier.phone ?? '',
        contact_person: supplier.contact_person ?? '',
        address: supplier.address ?? '',
      });
    }
  }, [supplier, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      if (!supplierId) throw new Error(TEXT.PROFILE_ERROR_NO_SUPPLIER);
      return updateSupplier(supplierId, {
        name: data.name,
        tax_code: data.tax_code || null,
        email: data.email || null,
        phone: data.phone || null,
        contact_person: data.contact_person || null,
        address: data.address || null,
      });
    },
    onSuccess: () => {
      toast.success(TEXT.PROFILE_UPDATE_SUCCESS);
      queryClient.invalidateQueries({
        queryKey: ['supplier-profile', supplierId],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || TEXT.PROFILE_UPDATE_ERROR);
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-surface-secondary rounded animate-pulse w-1/4" />
        <div className="h-64 bg-surface-secondary rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="UserCircle" className="text-foreground w-6 h-6" />
        <h1 className="text-2xl font-bold text-foreground">
          {TEXT.PROFILE_TITLE}
        </h1>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {TEXT.PROFILE_LABEL_NAME}
              </label>
              <Input
                {...register('name')}
                placeholder={TEXT.PROFILE_PLACEHOLDER_NAME}
                className={errors.name ? 'border-danger' : ''}
              />
              {errors.name && (
                <p className="text-danger text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {TEXT.PROFILE_LABEL_TAX}
              </label>
              <Input
                {...register('tax_code')}
                placeholder={TEXT.PROFILE_PLACEHOLDER_TAX}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {TEXT.PROFILE_LABEL_CONTACT}
              </label>
              <Input
                {...register('contact_person')}
                placeholder={TEXT.PROFILE_PLACEHOLDER_CONTACT}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {TEXT.PROFILE_LABEL_PHONE}
              </label>
              <Input
                {...register('phone')}
                placeholder={TEXT.PROFILE_PLACEHOLDER_PHONE}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {TEXT.PROFILE_LABEL_EMAIL}
              </label>
              <Input
                {...register('email')}
                placeholder={TEXT.PROFILE_PLACEHOLDER_EMAIL}
                className={errors.email ? 'border-danger' : ''}
              />
              {errors.email && (
                <p className="text-danger text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-foreground">
                {TEXT.PROFILE_LABEL_ADDRESS}
              </label>
              <Input
                {...register('address')}
                placeholder={TEXT.PROFILE_PLACEHOLDER_ADDRESS}
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-6">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || updateMutation.isPending}
            >
              {isSubmitting || updateMutation.isPending ? (
                <>
                  <Icon
                    name="loader-2"
                    className="animate-spin mr-2"
                    size={18}
                  />
                  {TEXT.PROFILE_SAVING}
                </>
              ) : (
                TEXT.PROFILE_SAVE
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
