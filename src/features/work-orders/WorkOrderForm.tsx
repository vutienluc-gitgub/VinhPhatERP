import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Combobox } from '@/shared/components/Combobox'
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet'
import { useStepper } from '@/shared/hooks/useStepper'
import { useBomList } from '@/features/bom/useBom'
import { useOrderList } from '@/features/orders/useOrders'
import { useSuppliersList } from '@/features/suppliers/useSuppliers'

import { createWorkOrderSchema, type CreateWorkOrderInput } from './work-orders.module'
import { useCreateWorkOrder, useUpdateWorkOrder, useUnitOptions } from './useWorkOrders'
import type { WorkOrder } from './types'

interface WorkOrderFormProps {
  initialData?: WorkOrder
  onSuccess?: () => void
  onCancel?: () => void
}

export function WorkOrderForm({ initialData, onSuccess, onCancel }: WorkOrderFormProps) {
  const createMutation = useCreateWorkOrder()
  const updateMutation = useUpdateWorkOrder()
  const isEditing = !!initialData

  const { data: boms } = useBomList({ status: 'approved' })
  const { data: orders } = useOrderList({ status: 'confirmed' }, 1)
  const { data: suppliersData } = useSuppliersList({ category: 'weaving', status: 'active' })
  const { data: units = [] } = useUnitOptions()
  const suppliers = suppliersData?.data || []

  const stepper = useStepper({ totalSteps: 2 })

  const { register, handleSubmit, trigger, control, formState: { errors, isValid } } = useForm<CreateWorkOrderInput>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: initialData ? {
      work_order_number: initialData.work_order_number,
      order_id: initialData.order_id,
      supplier_id: initialData.supplier_id,
      weaving_unit_price: initialData.weaving_unit_price,
      bom_template_id: initialData.bom_template_id,
      target_quantity_m: initialData.target_quantity_m,
      target_unit: initialData.target_unit,
      target_weight_kg: initialData.target_weight_kg,
      start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
      end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
      notes: initialData.notes ?? '',
    } : {
      work_order_number: `WO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`,
      order_id: null,
      supplier_id: '',
      weaving_unit_price: 0,
      bom_template_id: '',
      target_quantity_m: 0,
      target_unit: 'm',
      target_weight_kg: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: '',
    },
    mode: 'onTouched',
  })

  const onSubmit = async (values: CreateWorkOrderInput) => {
    if (!stepper.isLast) return

    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          input: {
            ...values,
            order_id: values.order_id === 'none' ? null : values.order_id,
          },
        })
      } else {
        await createMutation.mutateAsync({
          ...values,
          order_id: values.order_id === 'none' ? null : values.order_id,
        } as CreateWorkOrderInput)
      }
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to save work order:', error)
      alert('Có lỗi xảy ra: ' + (error as Error).message)
    }
  }

  async function handleNextStep() {
    if (stepper.currentStep === 0) {
      const stepValid = await trigger(['work_order_number', 'order_id', 'supplier_id', 'start_date'])
      if (stepValid) stepper.next()
    }
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onCancel || (() => {})}
      title={isEditing ? 'Chỉnh sửa Lệnh Sản Xuất' : 'Kiến tạo Lệnh Sản Xuất Mới'}
      stepInfo={{ current: stepper.currentStep, total: stepper.totalSteps }}
      maxWidth={720}
    >
      <form id="work-order-form" onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }} noValidate>
        {/* Scrollable Content Area */}
        <div className="form-grid">
          
          {/* ── BƯỚC 1: THÔNG TIN CƠ BẢN ── */}
          <div style={{ display: stepper.currentStep === 0 ? 'block' : 'none' }}>
            <div className="form-grid">
              <div className="form-field">
                <label>Mã Lệnh Sản Xuất <span className="field-required">*</span></label>
                <input
                  {...register('work_order_number')}
                  placeholder="Ví dụ: WO-2024-001"
                  className={`field-input${errors.work_order_number ? ' is-error' : ''}`}
                />
                {errors.work_order_number && <span className="field-error">{errors.work_order_number.message}</span>}
              </div>

              <div className="form-field">
                <label>Liên kết Đơn Hàng (ĐH)</label>
                <Controller
                  name="order_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                       options={[...(orders?.data ?? []).map((o) => ({
                        value: o.id,
                        label: `${o.order_number} — ${(o as { customers?: { name: string } }).customers?.name ?? ''}`
                      }))]}
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
                {errors.order_id && <span className="field-error">{errors.order_id.message}</span>}
              </div>

              <div className="form-field">
                <label>Đối tác dệt gia công <span className="field-required">*</span></label>
                <Controller
                  name="supplier_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={suppliers.map((s) => ({
                        value: s.id,
                        label: s.name,
                        code: s.code
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="— Chọn nhà dệt —"
                      hasError={!!errors.supplier_id}
                    />
                  )}
                />
                {errors.supplier_id && <span className="field-error">{errors.supplier_id.message}</span>}
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
          <div style={{ display: stepper.currentStep === 1 ? 'block' : 'none' }}>
            <div className="form-grid">
              <div className="form-field">
                <label>Công thức BOM định mức <span className="field-required">*</span></label>
                <Controller
                  name="bom_template_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={boms?.map((b) => ({
                        value: b.id,
                        label: `${b.code} — ${b.name} (V${b.active_version})`
                      })) || []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="— Chọn công thức dệt —"
                      hasError={!!errors.bom_template_id}
                    />
                  )}
                />
                {errors.bom_template_id && <span className="field-error">{errors.bom_template_id.message}</span>}
              </div>

              <div className="form-field">
                <label>Đơn giá gia công (đ/m)</label>
                <input
                  type="number"
                  {...register('weaving_unit_price', { valueAsNumber: true })}
                  className={`field-input${errors.weaving_unit_price ? ' is-error' : ''}`}
                  placeholder="Ví dụ: 3500"
                />
                {errors.weaving_unit_price && <span className="field-error">{errors.weaving_unit_price.message}</span>}
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-field" style={{ gridColumn: 'span 2' }}>
                  <label>Sản lượng mục tiêu <span className="field-required">*</span></label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      step="0.01"
                      {...register('target_quantity_m', { valueAsNumber: true })}
                      className={`field-input${errors.target_quantity_m ? ' is-error' : ''}`}
                      style={{ flex: 1 }}
                    />
                    <div style={{ width: '100px' }}>
                      <Controller
                        name="target_unit"
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={units.map((u) => ({ value: u, label: u }))}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {errors.target_quantity_m && <span className="field-error">{errors.target_quantity_m.message}</span>}
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
                  {errors.target_weight_kg && <span className="field-error">{errors.target_weight_kg.message}</span>}
                </div>
              </div>

              <div className="form-field">
                <label>Ghi chú sản xuất</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Hướng dẫn kỹ thuật hoặc ghi chú đặc biệt cho xưởng..."
                  className="field-textarea"
                />
              </div>
            </div>
          </div>
          
        </div>

        {/* Sticky Footer */}
        <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', justifyContent: 'space-between' }}>
          <div>
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
                disabled={createMutation.isPending || updateMutation.isPending || !isValid}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? 'Đang lưu...' 
                  : isEditing ? 'Cập nhật lệnh SX' : 'Xác nhận lệnh SX'}
              </button>
            )}
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  )
}
