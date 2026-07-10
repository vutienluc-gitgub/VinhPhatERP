import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { TabSwitcher } from '@/shared/components/TabSwitcher';
import {
  useCreateSupplier,
  useNextSupplierCode,
  useUpdateSupplier,
  useSupplierCategories,
} from '@/application/crm';
import {
  SUPPLIER_STATUSES,
  SUPPLIER_STATUS_LABELS,
  supplierDefaults,
  supplierSchema,
} from '@/schema/supplier.schema';
import type { SupplierFormValues } from '@/schema/supplier.schema';
import { getErrorMessage } from '@/shared/utils/error';

import { SupplierPriceList } from './SupplierPriceList';
import type { Supplier } from './types';

const STATUS_OPTIONS = SUPPLIER_STATUSES.map((st) => ({
  value: st,
  label: SUPPLIER_STATUS_LABELS[st],
}));

type SupplierFormProps = {
  supplier: Supplier | null;
  onClose: () => void;
};

function supplierToFormValues(supplier: Supplier): SupplierFormValues {
  return {
    code: supplier.code,
    name: supplier.name,
    category: supplier.category,
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
    address: supplier.address ?? '',
    tax_code: supplier.tax_code ?? '',
    contact_person: supplier.contact_person ?? '',
    notes: supplier.notes ?? '',
    status: supplier.status,
  };
}

export function SupplierForm({ supplier, onClose }: SupplierFormProps) {
  const isEditing = supplier !== null;
  const [activeTab, setActiveTab] = useState<'info' | 'prices'>('info');
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const { data: nextCode } = useNextSupplierCode();
  const { data: categories = [] } = useSupplierCategories();

  const CATEGORY_OPTIONS = categories.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: isEditing
      ? supplierToFormValues(supplier)
      : supplierDefaults,
  });

  useEffect(() => {
    reset(isEditing ? supplierToFormValues(supplier) : supplierDefaults);
  }, [supplier, isEditing, reset]);

  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode);
    }
  }, [isEditing, nextCode, setValue]);

  async function onSubmit(values: SupplierFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: supplier.id,
          values,
          expectedUpdatedAt: supplier.updated_at ?? undefined,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch {
      // Lỗi hiển thị qua mutationError bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open
      onClose={onClose}
      title={isEditing ? `Sửa NCC: ${supplier.name}` : 'Thêm nhà cung cấp mới'}
      footer={
        <div className="mt-6 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3 w-full">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto justify-center"
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="supplier-form"
            isLoading={isPending}
            className="w-full sm:w-auto justify-center"
          >
            {isEditing ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      }
    >
      {mutationError && (
        <p className="field-error mb-4">
          Lỗi: {getErrorMessage(mutationError)}
        </p>
      )}

      {isEditing && (
        <TabSwitcher
          tabs={[
            { key: 'info', label: 'Thông tin chung' },
            { key: 'prices', label: 'Báo giá (Price List)' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
          className="mb-6"
        />
      )}

      <div style={{ display: activeTab === 'info' ? 'block' : 'none' }}>
        <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            {/* Mã NCC + Tên NCC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field">
                <label htmlFor="code">
                  Mã NCC <span className="field-required">*</span>
                </label>
                <input
                  id="code"
                  type="text"
                  className={`field-input${errors.code ? ' is-error' : ''}`}
                  placeholder="VD: NCC-001"
                  readOnly={!isEditing}
                  {...register('code')}
                />
                {errors.code && (
                  <span className="field-error">{errors.code.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="name">
                  Tên nhà cung cấp <span className="field-required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={`field-input${errors.name ? ' is-error' : ''}`}
                  placeholder="VD: Công ty TNHH ABC"
                  {...register('name')}
                />
                {errors.name && (
                  <span className="field-error">{errors.name.message}</span>
                )}
              </div>
            </div>

            {/* Điện thoại + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  type="tel"
                  className={`field-input${errors.phone ? ' is-error' : ''}`}
                  placeholder="VD: 0901 234 567"
                  {...register('phone')}
                />
                {errors.phone && (
                  <span className="field-error">{errors.phone.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`field-input${errors.email ? ' is-error' : ''}`}
                  placeholder="VD: supplier@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <span className="field-error">{errors.email.message}</span>
                )}
              </div>
            </div>

            {/* Địa chỉ */}
            <div className="form-field">
              <label htmlFor="address">Địa chỉ</label>
              <input
                id="address"
                type="text"
                className="field-input"
                placeholder="VD: 123 Đường Lê Lợi, Q.1, TP.HCM"
                {...register('address')}
              />
            </div>

            {/* Mã số thuế + Người liên hệ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field">
                <label htmlFor="tax_code">Mã số thuế</label>
                <input
                  id="tax_code"
                  type="text"
                  className={`field-input${errors.tax_code ? ' is-error' : ''}`}
                  placeholder="VD: 0312345678"
                  {...register('tax_code')}
                />
                {errors.tax_code && (
                  <span className="field-error">{errors.tax_code.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="contact_person">Người liên hệ</label>
                <input
                  id="contact_person"
                  type="text"
                  className="field-input"
                  placeholder="VD: Nguyễn Văn A"
                  {...register('contact_person')}
                />
              </div>
            </div>

            {/* Danh mục + Trạng thái */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-field">
                <label htmlFor="category">
                  Danh mục <span className="field-required">*</span>
                </label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={CATEGORY_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.category}
                    />
                  )}
                />
                {errors.category && (
                  <span className="field-error">{errors.category.message}</span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="status">Trạng thái</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={STATUS_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div className="form-field">
              <label htmlFor="notes">Ghi chú</label>
              <textarea
                id="notes"
                className="field-input"
                rows={3}
                placeholder="Ghi chú nội bộ về nhà cung cấp..."
                {...register('notes')}
              />
            </div>
          </div>
        </form>
      </div>

      {isEditing && activeTab === 'prices' && supplier && (
        <div className="pt-2">
          <SupplierPriceList supplierId={supplier.id} />
        </div>
      )}
    </AdaptiveSheet>
  );
}
