import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';

import type { PrintSettingsFormValues } from '@/schema/company-settings.schema';
import { SETTINGS_LABELS } from '@/features/settings/settings.constants';

interface PrintMarginControlsProps {
  register: UseFormRegister<PrintSettingsFormValues>;
  errors: FieldErrors<PrintSettingsFormValues>;
  setValue: UseFormSetValue<PrintSettingsFormValues>;
}

export function PrintMarginControls({
  register,
  errors,
  setValue,
}: PrintMarginControlsProps) {
  const handleApplyPreset = (
    w: string,
    h: string,
    top: string,
    bottom: string,
    left: string,
    right: string,
  ) => {
    setValue('print_dot_matrix_width', w, { shouldDirty: true });
    setValue('print_dot_matrix_height', h, { shouldDirty: true });
    setValue('print_margin.top', top, { shouldDirty: true });
    setValue('print_margin.bottom', bottom, { shouldDirty: true });
    setValue('print_margin.left', left, { shouldDirty: true });
    setValue('print_margin.right', right, { shouldDirty: true });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Căn lề 4 hướng (Trên, Dưới, Trái, Phải) */}
      <div className="pt-2 border-t border-default/40">
        <span className="text-[11px] font-semibold text-foreground block mb-2">
          {SETTINGS_LABELS.PRINT_MARGIN_TITLE}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Lề trên */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="margin-top"
              className="text-[11px] font-medium text-muted"
            >
              {SETTINGS_LABELS.PRINT_MARGIN_TOP_SHORT}
            </label>
            <div className="relative flex items-center">
              <input
                id="margin-top"
                type="text"
                className={`field-input h-8 text-xs font-semibold font-mono text-center pr-6 ${
                  errors.print_margin?.top ? 'border-danger' : ''
                }`}
                placeholder="2"
                {...register('print_margin.top')}
              />
              <span className="absolute right-2 text-[10px] text-muted font-mono pointer-events-none">
                mm
              </span>
            </div>
            {errors.print_margin?.top && (
              <span className="text-[10px] text-danger">
                {errors.print_margin.top.message}
              </span>
            )}
          </div>

          {/* Lề dưới */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="margin-bottom"
              className="text-[11px] font-medium text-muted"
            >
              {SETTINGS_LABELS.PRINT_MARGIN_BOTTOM_SHORT}
            </label>
            <div className="relative flex items-center">
              <input
                id="margin-bottom"
                type="text"
                className={`field-input h-8 text-xs font-semibold font-mono text-center pr-6 ${
                  errors.print_margin?.bottom ? 'border-danger' : ''
                }`}
                placeholder="2"
                {...register('print_margin.bottom')}
              />
              <span className="absolute right-2 text-[10px] text-muted font-mono pointer-events-none">
                mm
              </span>
            </div>
            {errors.print_margin?.bottom && (
              <span className="text-[10px] text-danger">
                {errors.print_margin.bottom.message}
              </span>
            )}
          </div>

          {/* Lề trái */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="margin-left"
              className="text-[11px] font-medium text-muted"
            >
              {SETTINGS_LABELS.PRINT_MARGIN_LEFT_SHORT}
            </label>
            <div className="relative flex items-center">
              <input
                id="margin-left"
                type="text"
                className={`field-input h-8 text-xs font-semibold font-mono text-center pr-6 ${
                  errors.print_margin?.left ? 'border-danger' : ''
                }`}
                placeholder="3.5"
                {...register('print_margin.left')}
              />
              <span className="absolute right-2 text-[10px] text-muted font-mono pointer-events-none">
                mm
              </span>
            </div>
            {errors.print_margin?.left && (
              <span className="text-[10px] text-danger">
                {errors.print_margin.left.message}
              </span>
            )}
          </div>

          {/* Lề phải */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="margin-right"
              className="text-[11px] font-medium text-muted"
            >
              {SETTINGS_LABELS.PRINT_MARGIN_RIGHT_SHORT}
            </label>
            <div className="relative flex items-center">
              <input
                id="margin-right"
                type="text"
                className={`field-input h-8 text-xs font-semibold font-mono text-center pr-6 ${
                  errors.print_margin?.right ? 'border-danger' : ''
                }`}
                placeholder="3.5"
                {...register('print_margin.right')}
              />
              <span className="absolute right-2 text-[10px] text-muted font-mono pointer-events-none">
                mm
              </span>
            </div>
            {errors.print_margin?.right && (
              <span className="text-[10px] text-danger">
                {errors.print_margin.right.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-default/40">
        <span className="text-[10px] text-muted font-medium">
          {SETTINGS_LABELS.PRINT_PRESET_LABEL}:
        </span>
        <button
          type="button"
          onClick={() =>
            handleApplyPreset('200mm', '140mm', '2mm', '2mm', '3.5mm', '3.5mm')
          }
          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-default hover:bg-surface-secondary text-foreground transition-colors"
        >
          200 × 140 mm (Chuẩn VP)
        </button>
        <button
          type="button"
          onClick={() =>
            handleApplyPreset('210mm', '148mm', '3mm', '3mm', '5mm', '5mm')
          }
          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-default hover:bg-surface-secondary text-foreground transition-colors"
        >
          A5 Chuẩn (ISO)
        </button>
        <button
          type="button"
          onClick={() =>
            handleApplyPreset('200mm', '140mm', '0mm', '0mm', '0mm', '0mm')
          }
          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-default hover:bg-surface-secondary text-foreground transition-colors"
        >
          Lề 0mm (Sát mép)
        </button>
      </div>
    </div>
  );
}
