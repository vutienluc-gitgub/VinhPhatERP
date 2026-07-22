import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { colorSchema, colorDefaultValues } from '@/schema/color.schema';
import type { ColorFormValues, ColorRow } from '@/schema/color.schema';
import { useColorMutations } from '@/application/color-catalog';
import { NumericInput } from '@/shared/value';

import { COLOR_CATALOG_MESSAGES as MSG } from './color-catalog.constants';

type ColorFormProps = {
  initialData: ColorRow | null;
  onClose: () => void;
};

export function ColorForm({ initialData, onClose }: ColorFormProps) {
  const isEditing = !!initialData;
  const { upsertMutation } = useColorMutations();
  const confirm = useConfirm();

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
        isEditing ? MSG.MSG_UPDATE_SUCCESS : MSG.MSG_CREATE_SUCCESS,
      );
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await confirm.alert(MSG.MSG_SAVE_ERROR + message);
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
          {MSG.LBL_CODE} <span className="field-required">*</span>
        </label>
        <input
          id="code"
          type="text"
          className={`field-input ${errors.code ? 'border-danger' : ''}`}
          placeholder={MSG.PH_CODE}
          readOnly={isEditing}
          {...register('code')}
        />
        {errors.code && <p className="field-error">{errors.code.message}</p>}
        {isEditing && (
          <p className="field-hint text-xs mt-1">{MSG.HINT_CODE_READONLY}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="name">
          {MSG.LBL_NAME} <span className="field-required">*</span>
        </label>
        <input
          id="name"
          type="text"
          className={`field-input ${errors.name ? 'border-danger' : ''}`}
          placeholder={MSG.PH_NAME}
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
        <label htmlFor="color_group">{MSG.LBL_GROUP}</label>
        <select
          id="color_group"
          className={`field-select ${errors.color_group ? 'border-danger' : ''}`}
          {...register('color_group')}
        >
          <option value="">-- {MSG.TAB_NONE} --</option>
          <option value="Màu Đậm">{MSG.TAB_DARK}</option>
          <option value="Màu Trung">{MSG.TAB_MIDDLE}</option>
          <option value="Màu Lợt">{MSG.TAB_LIGHT}</option>
        </select>
        {errors.color_group && (
          <p className="field-error">{errors.color_group.message}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="note">{MSG.LBL_NOTE}</label>
        <textarea
          id="note"
          className="field-textarea"
          rows={3}
          placeholder={MSG.PH_NOTE}
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
          {MSG.BTN_CANCEL}
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={upsertMutation.isPending}
        >
          {upsertMutation.isPending
            ? MSG.BTN_SAVING
            : isEditing
              ? MSG.BTN_SAVE
              : MSG.BTN_CREATE}
        </Button>
      </div>
    </form>
  );
}
