import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { colorSchema, colorDefaultValues } from '@/schema/color.schema';
import type { ColorFormValues, ColorRow } from '@/schema/color.schema';
import { useColorMutations } from '@/application/color-catalog';

type ColorFormProps = {
  initialData: ColorRow | null;
  onClose: () => void;
};

export function ColorForm({ initialData, onClose }: ColorFormProps) {
  const isEditing = !!initialData;
  const { upsertMutation } = useColorMutations();

  const {
    register,
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
      toast.success(isEditing ? 'Cập nhật thành công' : 'Thêm mới thành công');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('Có lỗi xảy ra: ' + message);
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
          Mã màu <span className="field-required">*</span>
        </label>
        <input
          id="code"
          type="text"
          className={`field-input ${errors.code ? 'is-error' : ''}`}
          placeholder="VD: RD-02"
          readOnly={isEditing}
          {...register('code')}
        />
        {errors.code && <p className="field-error">{errors.code.message}</p>}
        {isEditing && (
          <p className="field-hint text-xs mt-1">
            Mã màu không thể thay đổi sau khi tạo
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="name">
          Tên màu <span className="field-required">*</span>
        </label>
        <input
          id="name"
          type="text"
          className={`field-input ${errors.name ? 'is-error' : ''}`}
          placeholder="VD: Đỏ đô (Maroon)"
          {...register('name')}
        />
        {errors.name && <p className="field-error">{errors.name.message}</p>}
      </div>

      <div className="form-field">
        <label htmlFor="trend_year">Năm xu hướng</label>
        <input
          id="trend_year"
          type="number"
          className={`field-input ${errors.trend_year ? 'is-error' : ''}`}
          {...register('trend_year', { valueAsNumber: true })}
        />
        {errors.trend_year && (
          <p className="field-error">{errors.trend_year.message}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="color_group">Nhóm màu</label>
        <select
          id="color_group"
          className={`field-select ${errors.color_group ? 'is-error' : ''}`}
          {...register('color_group')}
        >
          <option value="">-- Chọn nhóm màu --</option>
          <option value="Màu Đậm">Màu Đậm</option>
          <option value="Màu Trung">Màu Trung</option>
          <option value="Màu Lợt">Màu Lợt</option>
        </select>
        {errors.color_group && (
          <p className="field-error">{errors.color_group.message}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="note">Ghi chú</label>
        <textarea
          id="note"
          className="field-textarea"
          rows={3}
          placeholder="Thông tin thêm..."
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
          Hủy
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={upsertMutation.isPending}
        >
          {upsertMutation.isPending
            ? 'Đang lưu...'
            : isEditing
              ? 'Cập nhật'
              : 'Thêm mới'}
        </Button>
      </div>
    </form>
  );
}
