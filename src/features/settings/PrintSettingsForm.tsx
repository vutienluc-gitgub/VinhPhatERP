import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { useCompanySettings } from '@/application/settings';
import { Button, Icon } from '@/shared/components';
import { Switch } from '@/shared/components/Switch';
import {
  printSettingsDefaults,
  printSettingsSchema,
  type PrintSettingsFormValues,
} from '@/schema/company-settings.schema';
import { exportShipmentToPdf } from '@/shared/services/print/shipment';
import type { ShipmentDocument } from '@/domain/shipments/types';

import { PrintLivePreview } from './PrintLivePreview';
import { SETTINGS_LABELS, SETTINGS_MESSAGES } from './settings.constants';
import { usePrintSettings, useUpdatePrintSettings } from './usePrintSettings';

const TEST_SHIPMENT_FIXTURE: ShipmentDocument = {
  id: 'test-shipment-preview',
  shipment_number: 'XK2604-0001',
  order_id: 'order-1',
  customer_id: 'customer-1',
  shipment_date: '2026-04-02',
  delivery_address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
  carrier: 'Xe tải Vĩnh Phát (51C-123.45)',
  tracking_number: null,
  status: 'shipped',
  notes: 'Giao trong giờ hành chính. Liên hệ trước khi đến 15 phút.',
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_chat_at: null,
  delivery_staff_id: null,
  shipping_rate_id: null,
  shipping_cost: 0,
  loading_fee: 0,
  total_weight_kg: null,
  total_meters: null,
  vehicle_info: null,
  prepared_at: null,
  shipped_at: null,
  delivered_at: null,
  delivery_proof: null,
  receiver_name: 'Trần Văn B',
  receiver_phone: '0909 888 999',
  employee_id: null,
  tenant_id: null,
  journey_status: null,
  signed_at: null,
  customer_signature_url: null,
  proof_photos: null,
  orders: { order_number: 'DH2604-0012' },
  customers: {
    name: 'Công ty TNHH May Mặc Thời Trang Á Đông',
    code: 'KH-ADONG-01',
    address: '456 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    phone: '0909 123 456',
    contact_person: 'Nguyễn Thị Thu',
  },
  shipment_items: [
    {
      id: 'item-1',
      shipment_id: 'test-shipment-preview',
      finished_roll_id: 'roll-101',
      fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
      color_name: 'Trắng Sứ (W-01)',
      quantity: 120.5,
      unit: 'm',
      roll_number: 'C01',
      roll_length_m: null,
      warehouse_location: null,
      notes: 'Đạt chuẩn kiểm kim',
      price_per_meter: null,
      sort_order: 1,
      tenant_id: null,
      total_amount: null,
    },
    {
      id: 'item-2',
      shipment_id: 'test-shipment-preview',
      finished_roll_id: 'roll-102',
      fabric_type: 'Vải Cotton 100% 2 chiều 230gsm',
      color_name: 'Trắng Sứ (W-01)',
      quantity: 118.0,
      unit: 'm',
      roll_number: 'C02',
      roll_length_m: null,
      warehouse_location: null,
      notes: null,
      price_per_meter: null,
      sort_order: 2,
      tenant_id: null,
      total_amount: null,
    },
    {
      id: 'item-3',
      shipment_id: 'test-shipment-preview',
      finished_roll_id: 'roll-103',
      fabric_type: 'Vải CVC 65/35 Cá Sấu 4 chiều',
      color_name: 'Xanh Navy (NV-09)',
      quantity: 145.2,
      unit: 'm',
      roll_number: 'C03',
      roll_length_m: null,
      warehouse_location: null,
      notes: null,
      price_per_meter: null,
      sort_order: 3,
      tenant_id: null,
      total_amount: null,
    },
  ],
};

export function PrintSettingsForm() {
  const { data: initialValues, isLoading } = usePrintSettings();
  const { data: companySettings } = useCompanySettings();
  const updateMutation = useUpdatePrintSettings();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PrintSettingsFormValues>({
    resolver: zodResolver(printSettingsSchema),
    defaultValues: printSettingsDefaults,
  });

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  const watchedValues = watch();
  const selectedFormat = watchedValues.print_default_format;
  const footerNoteLength = (watchedValues.print_footer_note ?? '').length;

  const handleTestPrint = () => {
    const format = selectedFormat === 'A5_DOT_MATRIX' ? 'A5_DOT_MATRIX' : 'A4';
    void exportShipmentToPdf(TEST_SHIPMENT_FIXTURE, {
      format,
      companyName:
        companySettings?.company_name || 'CÔNG TY TNHH DỆT MAY VĨNH PHÁT',
      logoUrl: companySettings?.print_logo_url || '/favicon.svg',
      showLogo: watchedValues.print_show_logo,
      showQr: watchedValues.print_show_qr,
      footerNote: watchedValues.print_footer_note,
      dotMatrixWidth: watchedValues.print_dot_matrix_width,
      dotMatrixHeight: watchedValues.print_dot_matrix_height,
      margin: watchedValues.print_margin,
    });
  };

  const onSubmit = async (values: PrintSettingsFormValues) => {
    try {
      await updateMutation.mutateAsync(values);
      toast.success(SETTINGS_MESSAGES.SAVE_SUCCESS);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`${SETTINGS_MESSAGES.SAVE_ERROR} ${msg}`);
    }
  };

  if (isLoading) {
    return (
      <div className="panel-card card-flush p-6 animate-pulse">
        <div className="h-6 w-48 bg-surface-secondary rounded mb-4" />
        <div className="h-20 bg-surface-secondary rounded" />
      </div>
    );
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon name="Printer" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              {SETTINGS_LABELS.PRINT_TITLE}
            </h3>
            <p className="text-xs text-muted-foreground">
              {SETTINGS_LABELS.PRINT_SUBTITLE}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8"
        >
          {/* CỘT TRÁI: Form Controls */}
          <div className="flex flex-col gap-6">
            {/* Feedback Messages */}
            {updateMutation.isSuccess && (
              <div className="success-inline flex items-center gap-2 text-sm text-success bg-success-soft px-3 py-2 rounded-lg">
                <Icon name="CheckCircle2" size={16} strokeWidth={2} />
                {SETTINGS_MESSAGES.SAVE_SUCCESS}
              </div>
            )}

            {updateMutation.error && (
              <div className="error-inline flex items-center gap-2 text-sm text-danger bg-danger-soft px-3 py-2 rounded-lg">
                <Icon name="AlertCircle" size={16} strokeWidth={2} />
                {SETTINGS_MESSAGES.SAVE_ERROR}{' '}
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : String(updateMutation.error)}
              </div>
            )}

            {/* 1. Format Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">
                {SETTINGS_LABELS.PRINT_FORMAT_LABEL}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* A4 Laser */}
                <button
                  type="button"
                  onClick={() =>
                    setValue('print_default_format', 'A4', {
                      shouldDirty: true,
                    })
                  }
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    selectedFormat === 'A4'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-default bg-surface hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {SETTINGS_LABELS.PRINT_FORMAT_A4_TITLE}
                    </span>
                    <Icon
                      name="FileText"
                      size={18}
                      className={
                        selectedFormat === 'A4'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {SETTINGS_LABELS.PRINT_FORMAT_A4_DESC}
                  </span>
                </button>

                {/* A5 Dot Matrix */}
                <button
                  type="button"
                  onClick={() =>
                    setValue('print_default_format', 'A5_DOT_MATRIX', {
                      shouldDirty: true,
                    })
                  }
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    selectedFormat === 'A5_DOT_MATRIX'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-default bg-surface hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {SETTINGS_LABELS.PRINT_FORMAT_A5_TITLE}
                    </span>
                    <Icon
                      name="Printer"
                      size={18}
                      className={
                        selectedFormat === 'A5_DOT_MATRIX'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {SETTINGS_LABELS.PRINT_FORMAT_A5_DESC}
                  </span>
                </button>

                {/* K80 Thermal */}
                <button
                  type="button"
                  onClick={() =>
                    setValue('print_default_format', 'K80', {
                      shouldDirty: true,
                    })
                  }
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    selectedFormat === 'K80'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-default bg-surface hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {SETTINGS_LABELS.PRINT_FORMAT_K80_TITLE}
                    </span>
                    <Icon
                      name="Receipt"
                      size={18}
                      className={
                        selectedFormat === 'K80'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {SETTINGS_LABELS.PRINT_FORMAT_K80_DESC}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. A5 Dot Matrix Micro Spec Bar (Sleek 4-column inline) */}
            {selectedFormat === 'A5_DOT_MATRIX' && (
              <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-default flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Icon
                      name="SlidersHorizontal"
                      size={14}
                      className="text-primary"
                    />
                    <span>{SETTINGS_LABELS.PRINT_A5_SPEC_TITLE}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {SETTINGS_LABELS.PRINT_A5_SPEC_SUB}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Bề rộng */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="dot-matrix-width"
                      className="text-[11px] font-medium text-muted-foreground"
                    >
                      {SETTINGS_LABELS.PRINT_WIDTH_SHORT}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="dot-matrix-width"
                        type="text"
                        className={`field-input h-8 text-xs font-semibold font-mono text-center pr-6 ${
                          errors.print_dot_matrix_width ? 'border-danger' : ''
                        }`}
                        placeholder="200"
                        {...register('print_dot_matrix_width')}
                      />
                      <span className="absolute right-2 text-[10px] text-muted-foreground font-mono pointer-events-none">
                        mm
                      </span>
                    </div>
                    {errors.print_dot_matrix_width && (
                      <span className="text-[10px] text-danger">
                        {errors.print_dot_matrix_width.message}
                      </span>
                    )}
                  </div>

                  {/* Chiều cao */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="dot-matrix-height"
                      className="text-[11px] font-medium text-muted-foreground"
                    >
                      {SETTINGS_LABELS.PRINT_HEIGHT_SHORT}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="dot-matrix-height"
                        type="text"
                        className={`field-input h-8 text-xs font-semibold font-mono text-center pr-6 ${
                          errors.print_dot_matrix_height ? 'border-danger' : ''
                        }`}
                        placeholder="148"
                        {...register('print_dot_matrix_height')}
                      />
                      <span className="absolute right-2 text-[10px] text-muted-foreground font-mono pointer-events-none">
                        mm
                      </span>
                    </div>
                    {errors.print_dot_matrix_height && (
                      <span className="text-[10px] text-danger">
                        {errors.print_dot_matrix_height.message}
                      </span>
                    )}
                  </div>

                  {/* Lề trái */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="margin-left"
                      className="text-[11px] font-medium text-muted-foreground"
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
                        placeholder="3"
                        {...register('print_margin.left')}
                      />
                      <span className="absolute right-2 text-[10px] text-muted-foreground font-mono pointer-events-none">
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
                      className="text-[11px] font-medium text-muted-foreground"
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
                        placeholder="3"
                        {...register('print_margin.right')}
                      />
                      <span className="absolute right-2 text-[10px] text-muted-foreground font-mono pointer-events-none">
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

                {/* Quick Presets Bar */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-default/40">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {SETTINGS_LABELS.PRINT_PRESET_LABEL}:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('print_dot_matrix_width', '200mm', {
                        shouldDirty: true,
                      });
                      setValue('print_dot_matrix_height', '148mm', {
                        shouldDirty: true,
                      });
                      setValue('print_margin.left', '3mm', {
                        shouldDirty: true,
                      });
                      setValue('print_margin.right', '3mm', {
                        shouldDirty: true,
                      });
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-default hover:bg-surface-secondary text-foreground transition-colors"
                  >
                    200 × 148 mm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('print_dot_matrix_width', '210mm', {
                        shouldDirty: true,
                      });
                      setValue('print_dot_matrix_height', '148mm', {
                        shouldDirty: true,
                      });
                      setValue('print_margin.left', '3mm', {
                        shouldDirty: true,
                      });
                      setValue('print_margin.right', '3mm', {
                        shouldDirty: true,
                      });
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-default hover:bg-surface-secondary text-foreground transition-colors"
                  >
                    210 × 148 mm (ISO)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('print_dot_matrix_width', '190mm', {
                        shouldDirty: true,
                      });
                      setValue('print_dot_matrix_height', '140mm', {
                        shouldDirty: true,
                      });
                      setValue('print_margin.left', '3mm', {
                        shouldDirty: true,
                      });
                      setValue('print_margin.right', '3mm', {
                        shouldDirty: true,
                      });
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-default hover:bg-surface-secondary text-foreground transition-colors"
                  >
                    190 × 140 mm (Hẹp)
                  </button>
                </div>
              </div>
            )}

            {/* 3. Element Toggles */}
            <div className="flex flex-col gap-3 border-t border-default pt-4">
              {/* Show Logo Switch */}
              <div className="flex items-center justify-between py-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {SETTINGS_LABELS.PRINT_SHOW_LOGO_LABEL}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {SETTINGS_LABELS.PRINT_SHOW_LOGO_DESC}
                  </span>
                </div>
                <Controller
                  name="print_show_logo"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      aria-label={SETTINGS_LABELS.PRINT_SHOW_LOGO_LABEL}
                    />
                  )}
                />
              </div>

              {/* Show QR Switch */}
              <div className="flex items-center justify-between py-1 border-t border-default/50 pt-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {SETTINGS_LABELS.PRINT_SHOW_QR_LABEL}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {SETTINGS_LABELS.PRINT_SHOW_QR_DESC}
                  </span>
                </div>
                <Controller
                  name="print_show_qr"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      aria-label={SETTINGS_LABELS.PRINT_SHOW_QR_LABEL}
                    />
                  )}
                />
              </div>
            </div>

            {/* 4. Footer Disclaimer Note */}
            <div className="flex flex-col gap-1.5 border-t border-default pt-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="print-footer-note"
                  className="text-sm font-semibold text-foreground"
                >
                  {SETTINGS_LABELS.PRINT_FOOTER_NOTE_LABEL}
                </label>
                <span className="text-xs text-muted-foreground font-mono">
                  {footerNoteLength}/500
                </span>
              </div>
              <textarea
                id="print-footer-note"
                rows={3}
                className={`field-input ${
                  errors.print_footer_note ? 'border-danger' : ''
                }`}
                placeholder={SETTINGS_LABELS.PRINT_FOOTER_NOTE_PLACEHOLDER}
                {...register('print_footer_note')}
              />
              {errors.print_footer_note && (
                <span className="text-xs text-danger">
                  {errors.print_footer_note.message}
                </span>
              )}
            </div>

            {/* Submit Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="px-6 py-2.5 font-bold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Icon
                      name="Loader2"
                      className="animate-spin mr-2"
                      size={16}
                    />
                    {SETTINGS_LABELS.BTN_SAVING}
                  </>
                ) : (
                  <>
                    <Icon name="Check" className="mr-2" size={16} />
                    {SETTINGS_LABELS.PRINT_BTN_SAVE}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* CỘT PHẢI: Live Preview Engine */}
          <div className="w-full">
            <PrintLivePreview
              values={watchedValues}
              companyName={
                companySettings?.company_name ||
                'CÔNG TY TNHH DỆT MAY VĨNH PHÁT'
              }
              logoUrl={companySettings?.print_logo_url || '/favicon.svg'}
              onTestPrint={handleTestPrint}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
