import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import type { UseFormWatch } from 'react-hook-form';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

import {
  useBomList,
  useOrderList,
  useAllSuppliers,
} from '@/shared/hooks/useFormOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { Combobox } from '@/shared/components/Combobox';
import { MoneyInput } from '@/shared/value';
import DraftBanner from '@/shared/components/DraftBanner';
import SaveStatus from '@/shared/components/SaveStatus';
import { useAutoSave, loadDraft, clearDraft } from '@/shared/hooks/useAutoSave';
import { useStepper } from '@/shared/hooks/useStepper';
import {
  useCreateWorkOrder,
  useUpdateWorkOrder,
  useUnitOptions,
  useWorkOrderRequirements,
} from '@/application/production';
import { useLoomOptions } from '@/application/settings/useLooms';
import { useWorkOrderLogic } from '@/application/production';
import {
  createWorkOrderSchema,
  generateWorkOrderNumber,
  type CreateWorkOrderInput,
} from '@/schema/work-order.schema';

import type { WorkOrder } from './types';
import { WorkOrderYarnTable } from './WorkOrderYarnTable';
import { YarnAvailabilityWarning } from './components/YarnAvailabilityWarning';
import { WORK_ORDER_MESSAGES as MSG } from './work-orders.constants';

const DRAFT_KEY = 'work-order-draft';

/**
 * Isolated sub-component that subscribes to ALL form values for auto-save.
 * By extracting this, the re-renders caused by watch() are confined here
 * and do NOT propagate to the main WorkOrderForm tree.
 */
function AutoSaveSubscriber({
  watch,
}: {
  watch: UseFormWatch<CreateWorkOrderInput>;
}) {
  const formValues = watch();
  const { status: saveStatus, lastSavedAt } = useAutoSave({
    key: DRAFT_KEY,
    data: formValues,
    delay: 800,
  });

  return <SaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />;
}

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
  const { data: suppliersData } = useAllSuppliers({
    category: 'GREIGE',
    status: 'active',
  });
  const { data: units = [] } = useUnitOptions();
  const { data: looms = [] } = useLoomOptions();

  const orderOptions = useMemo(
    () =>
      (orders?.data ?? []).map((o) => ({
        value: o.id,
        label: `${o.order_number} — ${(o as { customers?: { name: string } }).customers?.name ?? ''}`,
      })),
    [orders?.data],
  );

  const supplierOptions = useMemo(
    () =>
      (suppliersData || []).map((s) => ({
        value: s.id,
        label: s.name,
        code: s.code,
      })),
    [suppliersData],
  );

  const bomOptions = useMemo(
    () =>
      boms?.map((b) => ({
        value: b.id,
        label: `${b.code} — ${b.name} (V${b.active_version})`,
      })) || [],
    [boms],
  );

  const unitOptions = useMemo(
    () =>
      units.map((u) => ({
        value: u,
        label: u,
      })),
    [units],
  );

  // Fetch existing requirements if editing
  const { data: initialRequirements = [] } = useWorkOrderRequirements(
    initialData?.id || '',
  );

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
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<CreateWorkOrderInput>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: initialData
      ? {
          work_order_number:
            initialData.work_order_number || generateWorkOrderNumber(),
          order_id: initialData.order_id || null,
          supplier_id: initialData.supplier_id || '',
          weaving_unit_price: initialData.weaving_unit_price || 0,
          bom_template_id: initialData.bom_template_id || '',
          target_quantity: initialData.target_quantity || 0,
          target_unit: initialData.target_unit || 'm',
          target_weight_kg: initialData.target_weight_kg || 0,
          standard_loss_pct: initialData.standard_loss_pct || 0,
          start_date: initialData.start_date
            ? new Date(initialData.start_date).toISOString().split('T')[0]
            : '',
          end_date: initialData.end_date
            ? new Date(initialData.end_date).toISOString().split('T')[0]
            : '',
          notes: initialData.notes ?? '',
          loom_id: initialData.loom_id ?? '',
          yarn_requirements: [],
        }
      : {
          work_order_number: generateWorkOrderNumber(),
          order_id: null,
          supplier_id: '',
          weaving_unit_price: 0,
          bom_template_id: '',
          target_quantity: 0,
          target_unit: 'm',
          target_weight_kg: 0,
          standard_loss_pct: 0,
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          notes: '',
          loom_id: '',
          yarn_requirements: [],
        },
    mode: 'onTouched',
  });

  const selectedSupplierId = watch('supplier_id');

  const loomOptions = useMemo(() => {
    return looms
      .filter(
        (l) => !selectedSupplierId || l.supplier_id === selectedSupplierId,
      )
      .map((l) => ({
        value: l.id,
        label: `${l.code} — ${l.name}`,
      }));
  }, [looms, selectedSupplierId]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (!window.confirm(MSG.UNSAVED_WARNING)) {
        return false;
      }
    }
    onCancel?.();
    return true;
  }, [isDirty, onCancel]);

  const stepper = useStepper({
    totalSteps: 2,
    stepValidation: {
      0: () =>
        trigger(['work_order_number', 'order_id', 'supplier_id', 'start_date']),
    },
    onCancel: handleCancel,
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'yarn_requirements',
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
          allocated_kg: r.allocated_kg,
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
    initialQty: initialData?.target_quantity,
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
          expectedUpdatedAt: initialData.updated_at ?? undefined,
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
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to save work order:', error);
      alert('Co loi xay ra: ' + message);
    }
  };

  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={handleCancel}
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
        onKeyDown={stepper.handleKeyDown}
        className="flex flex-col h-full min-h-0"
        noValidate
      >
        {/* Draft Restoration Banner */}
        {showDraftBanner && (
          <DraftBanner
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
          />
        )}

        {/* Scrollable Content Area */}
        <div className="form-grid">
          {/* ── BƯỚC 1: THÔNG TIN CƠ BẢN ── */}
          <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
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
                  className={`field-input${errors.work_order_number ? ' border-danger' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      stepper.next();
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
                      options={orderOptions}
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
                      options={supplierOptions}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        // Reset loom_id if supplier changes
                        setValue('loom_id', '');
                      }}
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
                <label>Máy dệt dự kiến (Điều độ)</label>
                <Controller
                  name="loom_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={loomOptions}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder={
                        selectedSupplierId
                          ? loomOptions.length === 0
                            ? '— Nhà dệt này chưa có máy —'
                            : '— Chọn máy dệt —'
                          : '— Chọn nhà dệt trước —'
                      }
                      hasError={!!errors.loom_id}
                      disabled={!selectedSupplierId}
                    />
                  )}
                />
                {errors.loom_id && (
                  <span className="field-error">{errors.loom_id.message}</span>
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
          <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
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
                      options={bomOptions}
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
                    <MoneyInput
                      className={`field-input${errors.weaving_unit_price ? ' border-danger' : ''}`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Ví dụ: 3.500"
                      suffix=" đ/m"
                    />
                  )}
                />
                {errors.weaving_unit_price && (
                  <span className="field-error">
                    {errors.weaving_unit_price.message}
                  </span>
                )}
              </div>

              <div className="form-grid grid-cols-3">
                <div className="form-field col-span-2">
                  <label>
                    Sản lượng mục tiêu <span className="field-required">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      {...register('target_quantity', {
                        valueAsNumber: true,
                      })}
                      className={`field-input flex-1${errors.target_quantity ? ' border-danger' : ''}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (isValid) handleSubmit(onSubmit)();
                        }
                      }}
                    />
                    <div className="w-[100px]">
                      <Controller
                        name="target_unit"
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={unitOptions}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {errors.target_quantity && (
                    <span className="field-error">
                      {errors.target_quantity.message}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label>Khối lượng dự kiến (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('target_weight_kg', { valueAsNumber: true })}
                    className={`field-input${errors.target_weight_kg ? ' border-danger' : ''}`}
                  />
                  <span className="field-hint whitespace-nowrap">
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

              {/* Yarn Availability Warning */}
              <YarnAvailabilityWarning requirements={fields} />

              {/* Editable Yarn Table */}
              <WorkOrderYarnTable
                control={control}
                register={register}
                watch={watch}
              />
            </div>
          </div>
        </div>

        <StepperFooter
          stepper={stepper}
          onCancel={handleCancel}
          isPending={isPending}
          submitLabel={
            isEditing ? 'Cập nhật Lệnh Sản Xuất' : 'Xác nhận Lệnh Sản Xuất'
          }
        >
          <AutoSaveSubscriber watch={watch} />
        </StepperFooter>
      </form>
    </AdaptiveSheet>
  );
}
