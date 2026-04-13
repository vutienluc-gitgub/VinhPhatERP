import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import {
  useCreateFabricCatalog,
  useNextFabricCatalogCode,
  useUpdateFabricCatalog,
} from '@/application/settings';

import {
  fabricCatalogDefaultValues,
  fabricCatalogSchema,
  FABRIC_CATALOG_STATUS_LABELS,
} from './fabric-catalog.module';
import type { FabricCatalogFormValues } from './fabric-catalog.module';
import type { FabricCatalog } from './types';

type FabricCatalogFormProps = {
  catalog: FabricCatalog | null;
  onClose: () => void;
};

function catalogToFormValues(catalog: FabricCatalog): FabricCatalogFormValues {
  return {
    code: catalog.code,
    name: catalog.name,
    composition: catalog.composition ?? '',
    unit: catalog.unit,
    notes: catalog.notes ?? '',
    status: catalog.status,
  };
}

export function FabricCatalogForm({
  catalog,
  onClose,
}: FabricCatalogFormProps) {
  const isEditing = catalog !== null;
  const createMutation = useCreateFabricCatalog();
  const updateMutation = useUpdateFabricCatalog();
  const { data: nextCode } = useNextFabricCatalogCode();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FabricCatalogFormValues>({
    resolver: zodResolver(fabricCatalogSchema),
    defaultValues: isEditing
      ? catalogToFormValues(catalog)
      : fabricCatalogDefaultValues,
  });

  useEffect(() => {
    reset(
      isEditing ? catalogToFormValues(catalog) : fabricCatalogDefaultValues,
    );
  }, [catalog, isEditing, reset]);

  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode);
    }
  }, [isEditing, nextCode, setValue]);

  async function onSubmit(values: FabricCatalogFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: catalog.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch {
      // Lỗi hiện qua mutationError bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={isEditing ? `Sửa: ${catalog.name}` : 'Thêm loại vải'}
    >
      {mutationError && (
        <p className="error-inline" style={{ marginBottom: '1rem' }}>
          Lỗi: {(mutationError as Error).message}
        </p>
      )}

      <form
        id="fabric-catalog-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="form-grid">
          {/* Mã + Tên */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label htmlFor="fc-code">
                Mã vải <span className="field-required">*</span>
              </label>
              <input
                id="fc-code"
                className={`field-input${errors.code ? ' is-error' : ''}`}
                type="text"
                placeholder="VD: FC-001"
                readOnly={!isEditing}
                {...register('code')}
              />
              {errors.code && (
                <span className="field-error">{errors.code.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="fc-name">
                Tên loại vải <span className="field-required">*</span>
              </label>
              <input
                id="fc-name"
                className={`field-input${errors.name ? ' is-error' : ''}`}
                type="text"
                placeholder="VD: Cotton TC 65/35"
                {...register('name')}
              />
              {errors.name && (
                <span className="field-error">{errors.name.message}</span>
              )}
            </div>
          </div>

          {/* Thành phần + Đơn vị */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label htmlFor="fc-composition">Thành phần</label>
              <input
                id="fc-composition"
                className="field-input"
                type="text"
                placeholder="VD: 65% Polyester, 35% Cotton"
                {...register('composition')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="fc-unit">
                Đơn vị <span className="field-required">*</span>
              </label>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={[
                      {
                        value: 'kg',
                        label: 'kg',
                      },
                      {
                        value: 'm',
                        label: 'mét (m)',
                      },
                      {
                        value: 'cuộn',
                        label: 'cuộn',
                      },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.unit}
                    placeholder="Chọn..."
                  />
                )}
              />
              {errors.unit && (
                <span className="field-error">{errors.unit.message}</span>
              )}
            </div>
          </div>

          {/* Trạng thái */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Trạng thái</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={(['active', 'inactive'] as const).map((s) => ({
                      value: s,
                      label: FABRIC_CATALOG_STATUS_LABELS[s],
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.status}
                  />
                )}
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div className="form-field">
            <label htmlFor="fc-notes">Ghi chú</label>
            <textarea
              id="fc-notes"
              className="field-textarea"
              rows={2}
              placeholder="Ghi chú về loại vải..."
              {...register('notes')}
            />
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
          }}
        >
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <button
            className="primary-button btn-standard"
            type="submit"
            disabled={isPending}
          >
            {isPending
              ? 'Đang lưu...'
              : isEditing
                ? 'Cập nhật'
                : 'Thêm loại vải'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
