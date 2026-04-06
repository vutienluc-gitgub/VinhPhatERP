import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet'
import { Combobox } from '@/shared/components/Combobox'
import { useColorOptions, toColorComboboxOptions } from '@/shared/hooks/useColorOptions'
import { useStepper } from '@/shared/hooks/useStepper'

import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  rawFabricDefaults,
  rawFabricSchema,
} from './raw-fabric.module'
import type { RawFabricFormValues } from './raw-fabric.module'
import type { RawFabricRoll } from './types'
import { useCreateRawFabric, useUpdateRawFabric, useWeavingPartners, useWorkOrderOptions, useYarnReceiptOptions } from './useRawFabric'
import { QuickSupplierForm } from '@/shared/components/QuickSupplierForm'

type RawFabricFormProps = {
  roll: RawFabricRoll | null
  onClose: () => void
}

function rollToFormValues(roll: RawFabricRoll): RawFabricFormValues {
  return {
    roll_number: roll.roll_number,
    fabric_type: roll.fabric_type,
    color_name: roll.color_name ?? '',
    color_code: roll.color_code ?? '',
    width_cm: roll.width_cm ?? undefined,
    length_m: roll.length_m ?? undefined,
    weight_kg: roll.weight_kg ?? undefined,
    quality_grade: roll.quality_grade ?? undefined,
    status: roll.status,
    warehouse_location: roll.warehouse_location ?? '',
    production_date: roll.production_date ?? '',
    notes: roll.notes ?? '',
    yarn_receipt_id: roll.yarn_receipt_id ?? '',
    weaving_partner_id: roll.weaving_partner_id ?? '',
    work_order_id: roll.work_order_id ?? '',
    lot_number: roll.lot_number ?? '',
  }
}

export function RawFabricForm({ roll, onClose }: RawFabricFormProps) {
  const isEditing = roll !== null
  const [showQuickSupplier, setShowQuickSupplier] = useState(false)
  const createMutation = useCreateRawFabric()
  const updateMutation = useUpdateRawFabric()
  const { data: weavingPartners = [] } = useWeavingPartners()
  const { data: yarnReceipts = [] } = useYarnReceiptOptions()
  const { data: workOrders = [] } = useWorkOrderOptions()
  const { data: colorOptions = [] } = useColorOptions()

  const stepper = useStepper({ totalSteps: 3 })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RawFabricFormValues>({
    resolver: zodResolver(rawFabricSchema),
    defaultValues: isEditing ? rollToFormValues(roll) : rawFabricDefaults,
  })

  useEffect(() => {
    reset(isEditing ? rollToFormValues(roll) : rawFabricDefaults)
  }, [roll, isEditing, reset])

  async function handleNextStep() {
    let isValid = false
    if (stepper.currentStep === 0) {
      isValid = await trigger(['roll_number', 'fabric_type', 'width_cm', 'length_m', 'weight_kg'])
    } else if (stepper.currentStep === 1) {
      isValid = await trigger(['status', 'quality_grade'])
    }
    
    if (isValid) {
      stepper.next()
    }
  }

  async function onSubmit(values: RawFabricFormValues) {
    if (!stepper.isLast) {
      // Prevents accidental submit if enter is pressed on an earlier step
      return
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: roll.id, values })
      } else {
        await createMutation.mutateAsync(values)
      }
      onClose()
    } catch (err) {
      // Lỗi được hiển thị qua mutation.error bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error
  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <AdaptiveSheet 
      open={true} 
      onClose={onClose} 
      title={isEditing ? `Sửa cuộn: ${roll.roll_number}` : 'Nhập cuộn vải mộc mới'}
      stepInfo={{ current: stepper.currentStep, total: stepper.totalSteps }}
    >
      {mutationError && (
        <p className="error-inline" style={{ marginBottom: '1rem' }}>
          Lỗi: {(mutationError as Error).message}
        </p>
      )}

      <form id="raw-fabric-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          
          {/* ── BƯỚC 1: THÔNG TIN CƠ BẢN ── */}
          <div style={{ display: stepper.currentStep === 0 ? 'block' : 'none' }}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="lot_number">Số lô (Lot number)</label>
                <input
                  id="lot_number"
                  className="field-input"
                  type="text"
                  placeholder="VD: LOT-2026-001"
                  {...register('lot_number')}
                />
                <span className="field-hint">Nhóm các cuộn cùng lô sản xuất.</span>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="roll_number">
                    Mã cuộn <span className="field-required">*</span>
                  </label>
                  <input
                    id="roll_number"
                    className={`field-input${errors.roll_number ? ' is-error' : ''}`}
                    type="text"
                    placeholder="VD: RM-2024-001"
                    {...register('roll_number')}
                  />
                  {errors.roll_number && (
                    <span className="field-error">{errors.roll_number.message}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="fabric_type">
                    Loại vải <span className="field-required">*</span>
                  </label>
                  <input
                    id="fabric_type"
                    className={`field-input${errors.fabric_type ? ' is-error' : ''}`}
                    type="text"
                    placeholder="VD: Dệt thoi 60/40 TC"
                    {...register('fabric_type')}
                  />
                  {errors.fabric_type && (
                    <span className="field-error">{errors.fabric_type.message}</span>
                  )}
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="color_name">Màu vải</label>
                  <Controller
                    name="color_name"
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={toColorComboboxOptions(colorOptions)}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Chọn hoặc nhập màu..."
                      />
                    )}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="color_code">Mã màu</label>
                  <input
                    id="color_code"
                    className="field-input"
                    type="text"
                    placeholder="VD: TC-01"
                    {...register('color_code')}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="width_cm">Khổ vải (cm)</label>
                  <input
                    id="width_cm"
                    className={`field-input${errors.width_cm ? ' is-error' : ''}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="VD: 150"
                    {...register('width_cm')}
                  />
                  {errors.width_cm && (
                    <span className="field-error">{errors.width_cm.message}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="length_m">Độ dài (m)</label>
                  <input
                    id="length_m"
                    className={`field-input${errors.length_m ? ' is-error' : ''}`}
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="VD: 50"
                    {...register('length_m')}
                  />
                  {errors.length_m && (
                    <span className="field-error">{errors.length_m.message}</span>
                  )}
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="weight_kg">Trọng lượng (kg)</label>
                  <input
                    id="weight_kg"
                    className={`field-input${errors.weight_kg ? ' is-error' : ''}`}
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="VD: 25.5"
                    {...register('weight_kg')}
                  />
                  {errors.weight_kg && (
                    <span className="field-error">{errors.weight_kg.message}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="production_date">Ngày dệt</label>
                  <input
                    id="production_date"
                    className="field-input"
                    type="date"
                    {...register('production_date')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── BƯỚC 2: PHÂN LOẠI & LƯU TRỮ ── */}
          <div style={{ display: stepper.currentStep === 1 ? 'block' : 'none' }}>
            <div className="form-grid">
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label htmlFor="quality_grade">Chất lượng</label>
                  <Controller
                    name="quality_grade"
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={[
                          { value: '', label: 'Chưa kiểm định' },
                          ...QUALITY_GRADES.map((g) => ({
                            value: g,
                            label: QUALITY_GRADE_LABELS[g],
                          }))
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="status">Trạng thái</label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={ROLL_STATUSES.map((s) => ({
                          value: s,
                          label: ROLL_STATUS_LABELS[s],
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="warehouse_location">Vị trí kho</label>
                <input
                  id="warehouse_location"
                  className="field-input"
                  type="text"
                  placeholder="VD: A1-R3-S2"
                  {...register('warehouse_location')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="notes">Ghi chú</label>
                <textarea
                  id="notes"
                  className="field-textarea"
                  placeholder="Ghi chú thêm về cuộn vải, lỗi dệt nếu có..."
                  rows={3}
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          {/* ── BƯỚC 3: TRUY VẾT NGUỒN GỐC ── */}
          <div style={{ display: stepper.currentStep === 2 ? 'block' : 'none' }}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="work_order_id">Lệnh sản xuất (Work Order)</label>
                <Controller
                  name="work_order_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={workOrders.map((wo) => ({
                        value: wo.id,
                        label: `${wo.work_order_number} (${wo.bom_template?.name})`
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="— Không liên kết lệnh (Dự trữ) —"
                    />
                  )}
                />
                <span className="field-hint">Liên kết cuộn này với lệnh sản xuất để theo dõi tiến độ.</span>
              </div>

              <div className="form-field">
                <label htmlFor="weaving_partner_id">Nhà dệt gia công</label>
                <Controller
                  name="weaving_partner_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={weavingPartners.map((s) => ({
                        value: s.id,
                        label: `${s.name} (${s.code})`
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="— Chọn nhà dệt —"
                    />
                  )}
                />
              </div>

              {!showQuickSupplier && (
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setShowQuickSupplier(true)}
                  style={{ marginBottom: '1rem' }}
                >
                  + Tạo nhà dệt mới
                </button>
              )}
              {showQuickSupplier && (
                <div style={{ marginBottom: '1rem' }}>
                  <QuickSupplierForm
                    defaultCategory="weaving"
                    onCreated={(created) => {
                      setValue('weaving_partner_id', created.id)
                      setShowQuickSupplier(false)
                    }}
                    onCancel={() => setShowQuickSupplier(false)}
                  />
                </div>
              )}

              <div className="form-field">
                <label htmlFor="yarn_receipt_id">Phiếu nhập sợi nguồn</label>
                <Controller
                  name="yarn_receipt_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={yarnReceipts.map((r) => ({
                        value: r.id,
                        label: `${r.receipt_number} (${r.receipt_date})`
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="— Chọn phiếu sợi —"
                    />
                  )}
                />
                <span className="field-hint">Chỉ định sợi nguồn dùng để dệt nên cuộn mộc này.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', justifyContent: 'space-between' }}>
          <div>
            {!stepper.isFirst && (
              <button
                className="btn-secondary"
                type="button"
                onClick={stepper.prev}
                disabled={isPending}
              >
                Quay lại
              </button>
            )}
            {stepper.isFirst && (
              <button
                className="btn-secondary"
                type="button"
                onClick={onClose}
                disabled={isPending}
              >
                Hủy
              </button>
            )}
          </div>
          
          <div>
            {!stepper.isLast ? (
              <button
                className="primary-button btn-standard"
                type="button"
                onClick={handleNextStep}
                disabled={isPending}
              >
                Tiếp tục
              </button>
            ) : (
              <button
                className="primary-button btn-standard"
                type="submit"
                disabled={isPending}
              >
                {isPending ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Nhập kho'}
              </button>
            )}
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  )
}
