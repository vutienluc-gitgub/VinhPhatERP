import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';

import {
  useBomList,
  useOrderList,
  useSuppliersList,
} from '@/shared/hooks/useFormOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import DraftBanner from '@/shared/components/DraftBanner';
import SaveStatus from '@/shared/components/SaveStatus';
import { useAutoSave, loadDraft, clearDraft } from '@/shared/hooks/useAutoSave';
import { useStepper } from '@/shared/hooks/useStepper';

import type { WorkOrder } from './types';
import {
  useCreateWorkOrder,
  useUpdateWorkOrder,
  useUnitOptions,
  useWorkOrderRequirements,
} from './useWorkOrders';
import {
  createWorkOrderSchema,
  type CreateWorkOrderInput,
} from './work-orders.module';
import { WorkOrderYarnTable } from './WorkOrderYarnTable';
import { useWorkOrderLogic } from './useWorkOrderLogic';

const DRAFT_KEY = 'work-order-draft';

interface WorkOrderFormProps {
  initialData?: WorkOrder;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WorkOrderForm({
  initialData,
  onSuccess,
  onCancel,
}: WorkOrderFormProps) {
  const createMutation = useCreateWorkOrder();
  const updateMutation = useUpdateWorkOrder();
  const isEditing = !!initialData;

  const { data: boms } = useBomList({ status: 'approved' });
  const { data: orders } = useOrderList({ status: 'confirmed' }, 1);
  const { data: suppliersData } = useSuppliersList({
    category: 'weaving',
    status: 'active',
  });
  const { data: units = [] } = useUnitOptions();
  const suppliers = suppliersData?.data || [];

  // Fetch existing requirements if editing
  const { data: initialRequirements = [] } = useWorkOrderRequirements(
    initialData?.id || '',
  );

  const stepper = useStepper({ totalSteps: 2 });

  // Draft restoration state
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraft, setSavedDraft] = useState<CreateWorkOrderInput | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    trigger,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateWorkOrderInput>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: initialData
      ? {
          work_order_number: initialData.work_order_number,
          order_id: initialData.order_id,
          supplier_id: initialData.supplier_id,
          weaving_unit_price: initialData.weaving_unit_price,
          bom_template_id: initialData.bom_template_id,
          target_quantity_m: initialData.target_quantity_m,
          target_unit: initialData.target_unit,
          target_weight_kg: initialData.target_weight_kg,
          standard_loss_pct: initialData.standard_loss_pct || 0,
          start_date: initialData.start_date
            ? new Date(initialData.start_date).toISOString().split('T')[0]
            : '',
          end_date: initialData.end_date
            ? new Date(initialData.end_date).toISOString().split('T')[0]
            : '',
          notes: initialData.notes ?? '',
          yarn_requirements: [],
        }
      : {
          work_order_number: `WO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`,
          order_id: null,
          supplier_id: '',
          weaving_unit_price: 0,
          bom_template_id: '',
          target_quantity_m: 0,
          target_unit: 'm',
          target_weight_kg: 0,
          standard_loss_pct: 0,
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          notes: '',
          yarn_requirements: [],
        },
    mode: 'onTouched',
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'yarn_requirements',
  });

  // ── AUTO SAVE ──
  const formValues = watch();
  const {
    status: saveStatus,
    lastSavedAt,
    hasConflict,
  } = useAutoSave({
    key: DRAFT_KEY,
    data: formValues,
    delay: 800,
  });

  // ── DRAFT RESTORATION ──
  useEffect(() => {
    if (isEditing) return; // Don't restore drafts when editing existing orders
    const draft = loadDraft<CreateWorkOrderInput>(DRAFT_KEY);
    if (draft && draft.work_order_number) {
      setSavedDraft(draft);
      setShowDraftBanner(true);
    }
  }, [isEditing]);

  function handleRestoreDraft() {
    if (!savedDraft) return;
    reset(savedDraft);
    if (savedDraft.yarn_requirements?.length) {
      replace(savedDraft.yarn_requirements);
    }
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  function handleDiscardDraft() {
    clearDraft(DRAFT_KEY);
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  // ── KEYBOARD: Auto-focus first input ──
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (stepper.currentStep === 0) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [stepper.currentStep]);

  // ── Set initial requirements when editing ──
  useEffect(() => {
    if (isEditing && initialRequirements.length > 0 && fields.length === 0) {
      replace(
        initialRequirements.map((r) => ({
          yarn_catalog_id: r.yarn_catalog_id,
          bom_ratio_pct: r.bom_ratio_pct,
          required_kg: r.required_kg,
        })),
      );
    }
  }, [isEditing, initialRequirements, replace, fields.length]);

  // ── BOM auto-calculation (extracted to domain hook) ──
  useWorkOrderLogic({
    watch,
    setValue,
    replace,
    isEditing,
    initialBomId: initialData?.bom_template_id,
    initialQty: initialData?.target_quantity_m,
  });

  // ── Submit ──
  const onSubmit = async (values: CreateWorkOrderInput) => {
    if (!stepper.isLast) return;

    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          input: {
            ...values,
            order_id: values.order_id === 'none' ? null : values.order_id,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...values,
          order_id: values.order_id === 'none' ? null : values.order_id,
        } as CreateWorkOrderInput);
      }
      // Clear draft after successful submission
      clearDraft(DRAFT_KEY);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to save work order:', error);
      alert('Có lỗi xảy ra: ' + (error as Error).message);
    }
  };

  async function handleNextStep() {
    if (stepper.currentStep === 0) {
      const stepValid = await trigger([
        'work_order_number',
        'order_id',
        'supplier_id',
        'start_date',
      ]);
      if (stepValid) stepper.next();
    }
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onCancel || (() => {})}
      title={
        isEditing ? 'Chỉnh sửa Lệnh Sản Xuất' : 'Kiến tạo Lệnh Sản Xuất Mới'
      }
      stepInfo={{
        current: stepper.currentStep,
        total: stepper.totalSteps,
      }}
      maxWidth={720}
    >
      <form
        id="work-order-form"
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}
        noValidate
      >
        {/* Draft Restoration Banner */}
        {showDraftBanner && (
          <DraftBanner
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
            hasConflict={hasConflict}
          />
        )}

        {/* Scrollable Content Area */}
        <div className="form-grid">
          {/* ── BƯỚC 1: THÔNG TIN CƠ BẢN ── */}
          <div
            style={{ display: stepper.currentStep === 0 ? 'block' : 'none' }}
          >
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Mã Lệnh Sản Xuất <span className="field-required">*</span>
                </label>
                <input
                  {...register('work_order_number')}
                  ref={(e) => {
                    register('work_order_number').ref(e);
                    firstInputRef.current = e;
                  }}
                  placeholder="Ví dụ: WO-2024-001"
                  className={`field-input${errors.work_order_number ? ' is-error' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNextStep();
                    }
                  }}
                />
                {errors.work_order_number && (
                  <span className="field-error">
                    {errors.work_order_number.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label>Liên kết Đơn Hàng (ĐH)</label>
                <Controller
                  name="order_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={[
                        ...(orders?.data ?? []).map((o) => ({
                          value: o.id,
                          label: `${o.order_number} — ${(o as { customers?: { name: string } }).customers?.name ?? ''}`,
                        })),
                      ]}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="— Sản xuất dự trữ (Không ĐH) —"
                      hasError={!!errors.order_id}
                    />
                  )}
                />
                <span className="field-hint">
                  Chọn đơn hàng nếu sản xuất theo yêu cầu (MTO)
                </span>
                {errors.order_id && (
                  <span className="field-error">{errors.order_id.message}</span>
                )}
              </div>

              <div className="form-field">
                <label>
                  Đối tác dệt gia công <span className="field-required">*</span>
                </label>
                <Controller
                  name="supplier_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={suppliers.map((s) => ({
                        value: s.id,
                        label: s.name,
                        code: s.code,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="— Chọn nhà dệt —"
                      hasError={!!errors.supplier_id}
                    />
                  )}
                />
                {errors.supplier_id && (
                  <span className="field-error">
                    {errors.supplier_id.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label>Ngày bắt đầu dự kiến</label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="field-input"
                />
              </div>
            </div>
          </div>

          {/* ── BƯỚC 2: MỤC TIÊU SẢN XUẤT ── */}
          <div
            style={{ display: stepper.currentStep === 1 ? 'block' : 'none' }}
          >
            <div className="form-grid">
              <div className="form-field">
                <label>
                  Công thức BOM định mức{' '}
                  <span className="field-required">*</span>
                </label>
                <Controller
                  name="bom_template_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={
                        boms?.map((b) => ({
                          value: b.id,
                          label: `${b.code} — ${b.name} (V${b.active_version})`,
                        })) || []
                      }
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="— Chọn công thức dệt —"
                      hasError={!!errors.bom_template_id}
                    />
                  )}
                />
                {errors.bom_template_id && (
                  <span className="field-error">
                    {errors.bom_template_id.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label>Đơn giá gia công (đ/m)</label>
                <Controller
                  name="weaving_unit_price"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      className={`field-input${errors.weaving_unit_price ? ' is-error' : ''}`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ví dụ: 3.500"
                    />
                  )}
                />
                {errors.weaving_unit_price && (
                  <span className="field-error">
                    {errors.weaving_unit_price.message}
                  </span>
                )}
              </div>

              <div
                className="form-grid"
                style={{ gridTemplateColumns: '1fr 1fr 1fr' }}
              >
                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                  <label>
                    Sản lượng mục tiêu <span className="field-required">*</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                    }}
                  >
                    <input
                      type="number"
                      step="0.01"
                      {...register('target_quantity_m', {
                        valueAsNumber: true,
                      })}
                      className={`field-input${errors.target_quantity_m ? ' is-error' : ''}`}
                      style={{ flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (isValid) handleSubmit(onSubmit)();
                        }
                      }}
                    />
                    <div style={{ width: '100px' }}>
                      <Controller
                        name="target_unit"
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={units.map((u) => ({
                              value: u,
                              label: u,
                            }))}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {errors.target_quantity_m && (
                    <span className="field-error">
                      {errors.target_quantity_m.message}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label>Khối lượng dự kiến (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('target_weight_kg', { valueAsNumber: true })}
                    className={`field-input${errors.target_weight_kg ? ' is-error' : ''}`}
                  />
                  <span className="field-hint" style={{ whiteSpace: 'nowrap' }}>
                    Tự tính từ BOM nếu trống
                  </span>
                  {errors.target_weight_kg && (
                    <span className="field-error">
                      {errors.target_weight_kg.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label>Ghi chú sản xuất</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Hướng dẫn kỹ thuật hoặc ghi chú đặc biệt cho xưởng..."
                  className="field-textarea"
                />
              </div>

              {/* Editable Yarn Table */}
              <WorkOrderYarnTable
                control={control}
                register={register}
                watch={watch}
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            {!stepper.isFirst && (
              <button
                className="btn-secondary"
                type="button"
                onClick={stepper.prev}
                disabled={createMutation.isPending}
              >
                Quay lại
              </button>
            )}
            {stepper.isFirst && (
              <button
                className="btn-secondary"
                type="button"
                onClick={onCancel}
                disabled={createMutation.isPending}
              >
                Hủy bỏ
              </button>
            )}
            {/* Save Status Indicator */}
            <SaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />
          </div>

          <div>
            {!stepper.isLast ? (
              <button
                className="primary-button btn-standard"
                type="button"
                onClick={handleNextStep}
                disabled={createMutation.isPending}
              >
                Tiếp tục
              </button>
            ) : (
              <button
                className="primary-button btn-standard"
                type="submit"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !isValid
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Đang lưu...'
                  : isEditing
                    ? 'Cập nhật lệnh SX'
                    : 'Xác nhận lệnh SX'}
              </button>
            )}
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
