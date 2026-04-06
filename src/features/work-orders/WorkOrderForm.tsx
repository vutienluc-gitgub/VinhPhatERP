import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createWorkOrderSchema, type CreateWorkOrderInput } from './work-orders.module'
import { useCreateWorkOrder } from './useWorkOrders'
import { useBomList } from '../bom/useBom'
import { useOrderList } from '../orders/useOrders'
import { Combobox } from '@/shared/components/Combobox'
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet'
import { useStepper } from '@/shared/hooks/useStepper'

interface WorkOrderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function WorkOrderForm({ onSuccess, onCancel }: WorkOrderFormProps) {
  const createMutation = useCreateWorkOrder()

  const { data: boms } = useBomList({ status: 'approved' })
  const { data: orders } = useOrderList({ status: 'confirmed' }, 1)

  const stepper = useStepper({ totalSteps: 2 })

  const { register, handleSubmit, trigger, control, formState: { errors, isValid } } = useForm<CreateWorkOrderInput>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      work_order_number: `WO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`,
      order_id: null,
      bom_template_id: '',
      target_quantity_m: 0,
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
      await createMutation.mutateAsync({
        ...values,
        order_id: values.order_id === 'none' ? null : values.order_id,
      } as CreateWorkOrderInput)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Failed to create work order:', error)
      alert('Có lỗi xảy ra: ' + (error as Error).message)
    }
  }

  async function handleNextStep() {
    if (stepper.currentStep === 0) {
      const stepValid = await trigger(['work_order_number', 'order_id', 'start_date'])
      if (stepValid) stepper.next()
    }
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onCancel || (() => {})}
      title="Kiến tạo Lệnh Sản Xuất Mới"
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

              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="form-field">
                  <label>Sản lượng mục tiêu (m) <span className="field-required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('target_quantity_m', { valueAsNumber: true })}
                    className={`field-input${errors.target_quantity_m ? ' is-error' : ''}`}
                  />
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
                  <span className="field-hint">
                    Hệ thống sẽ tự tính từ BOM nếu để trống
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
                disabled={createMutation.isPending || !isValid}
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Xác nhận lệnh SX'}
              </button>
            )}
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  )
}
