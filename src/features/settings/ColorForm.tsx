import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button, VPSelect } from '@/shared/components';
import { colorSchema, colorDefaultValues } from '@/schema/color.schema';
import type { ColorFormValues, ColorRow } from '@/schema/color.schema';
import { useColorMutations } from '@/application/settings';
import { NumericInput } from '@/shared/value';

import { SETTINGS_LABELS, COLOR_GROUP_OPTIONS } from './settings.constants';

type ColorFormProps = {
  initialData: ColorRow | null;
  onClose: () => void;
};

export function ColorForm({ initialData, onClose }: ColorFormProps) {
  const isEditing = !!initialData;
  const { upsertMutation } = useColorMutations();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ColorFormValues>({
    resolver: zodResolver(colorSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          note: initialData.note || '',
          trend_year: initialData.trend_year || new Date().getFullYear(),
          color_group: initialData.color_group || null,
        }
      : colorDefaultValues,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code,
        name: initialData.name,
        note: initialData.note || '',
        trend_year: initialData.trend_year || new Date().getFullYear(),
        color_group: initialData.color_group || null,
      });
    } else {
      reset(colorDefaultValues);
    }
  }, [initialData, reset]);

  const onSubmit = async (values: ColorFormValues) => {
    try {
      await upsertMutation.mutateAsync(values);
      toast.success(
        isEditing
          ? SETTINGS_LABELS.COLOR_FORM_UPDATE_SUCCESS
          : SETTINGS_LABELS.COLOR_FORM_ADD_SUCCESS,
      );
      onClose();
    } catch (error) {
      toast.error(
        `${SETTINGS_LABELS.COLOR_FORM_ERROR} ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  return (
    <form
      id="color-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="form-field">
        <label htmlFor="code">
          {SETTINGS_LABELS.COLOR_FORM_CODE_LABEL || 'Mã màu'}{' '}
          <span className="field-required">*</span>
        </label>
        <input
          id="code"
          type="text"
          className={`field-input ${errors.code ? 'border-danger' : ''}`}
          placeholder={
            SETTINGS_LABELS.COLOR_FORM_CODE_PLACEHOLDER || 'VD: RD-02'
          }
          readOnly={isEditing}
          {...register('code')}
        />
        {errors.code && <p className="field-error">{errors.code.message}</p>}
        {isEditing && (
          <p className="field-hint text-xs mt-1">
            {SETTINGS_LABELS.COLOR_FORM_CODE_HINT ||
              'Mã màu không thể thay đổi sau khi tạo'}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="name">
          {SETTINGS_LABELS.COLOR_FORM_NAME_LABEL || 'Tên màu'}{' '}
          <span className="field-required">*</span>
        </label>
        <input
          id="name"
          type="text"
          className={`field-input ${errors.name ? 'border-danger' : ''}`}
          placeholder={SETTINGS_LABELS.COLOR_FORM_PLACEHOLDER}
          {...register('name')}
        />
        {errors.name && <p className="field-error">{errors.name.message}</p>}
      </div>

      <Controller
        name="trend_year"
        control={control}
        render={({ field }) => (
          <NumericInput
            id="trend_year"
            className={`field-input ${errors.trend_year ? 'border-danger' : ''}`}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />

      <div className="form-field">
        <label htmlFor="color_group">
          {SETTINGS_LABELS.COLOR_FORM_GROUP_LABEL}
        </label>
        <Controller
          name="color_group"
          control={control}
          render={({ field }) => (
            <VPSelect
              id="color_group"
              options={COLOR_GROUP_OPTIONS}
              value={field.value || undefined}
              onValueChange={field.onChange}
              placeholder={SETTINGS_LABELS.COLOR_FORM_GROUP_PLACEHOLDER}
              error={!!errors.color_group}
              className="w-full"
            />
          )}
        />
        {errors.color_group && (
          <p className="field-error">{errors.color_group.message}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="note">
          {SETTINGS_LABELS.COLOR_FORM_NOTE_LABEL || 'Ghi chú'}
        </label>
        <textarea
          id="note"
          className="field-textarea"
          rows={3}
          placeholder={SETTINGS_LABELS.COLOR_FORM_NOTES_PLACEHOLDER}
          {...register('note')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
        <Button
          variant="secondary"
          type="button"
          onClick={onClose}
          disabled={upsertMutation.isPending}
        >
          {SETTINGS_LABELS.COLOR_FORM_BTN_CANCEL || 'Hủy'}
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={upsertMutation.isPending}
        >
          {upsertMutation.isPending
            ? SETTINGS_LABELS.COLOR_FORM_BTN_UPDATING
            : isEditing
              ? SETTINGS_LABELS.COLOR_FORM_BTN_UPDATE
              : SETTINGS_LABELS.COLOR_FORM_BTN_ADD}
        </Button>
      </div>
    </form>
  );
}
