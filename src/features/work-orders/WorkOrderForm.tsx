import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createWorkOrderSchema, type CreateWorkOrderInput } from './work-orders.module';
import { useCreateWorkOrder } from './useWorkOrders';
import { useBomList } from '../bom/useBom';
import { useOrderList } from '../orders/useOrders';

interface WorkOrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WorkOrderForm({ onSuccess, onCancel }: WorkOrderFormProps) {
  const createMutation = useCreateWorkOrder();

  // Load active approved BOMs for dropdown
  const { data: boms } = useBomList({ status: 'approved' });
  // Load draft/confirmed orders for selection (MTO)
  const { data: orders } = useOrderList({ status: 'confirmed' }, 1);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateWorkOrderInput>({
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
  });

  const onSubmit = async (values: CreateWorkOrderInput) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        order_id: values.order_id === 'none' ? null : values.order_id
      } as CreateWorkOrderInput);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to create work order:', error);
      alert('Có lỗi xảy ra: ' + (error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
      {/* Scrollable Content Area */}
      <div className="modal-content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Work Order Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Mã Lệnh Sản Xuất <span className="text-red-500">*</span></label>
            <input
              {...register('work_order_number')}
              placeholder="Ví dụ: WO-2024-001"
              className={`field-input w-full min-h-[44px] ${errors.work_order_number ? 'is-error' : ''}`}
            />
            {errors.work_order_number && (
               <p className="text-xs text-red-500 font-medium">{errors.work_order_number.message}</p>
            )}
          </div>

          {/* Order ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Liên kết Đơn Hàng (ĐH)</label>
            <select
              {...register('order_id')}
              className={`field-select w-full min-h-[44px] ${errors.order_id ? 'is-error' : ''}`}
            >
              <option value="none">-- Sản xuất dự trữ (Không ĐH) --</option>
              {orders?.data?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} — {o.customers?.name}
                </option>
              ))}
            </select>
            <p className="text-[0.7rem] text-neutral-400 italic">Chọn đơn hàng nếu sản xuất theo yêu cầu (MTO)</p>
            {errors.order_id && (
              <p className="text-xs text-red-500 font-medium">{errors.order_id.message}</p>
            )}
          </div>

          {/* BOM Template ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Công thức BOM định mức <span className="text-red-500">*</span></label>
            <select
              {...register('bom_template_id')}
              className={`field-select w-full min-h-[44px] ${errors.bom_template_id ? 'is-error' : ''}`}
            >
              <option value="">-- Chọn công thức dệt --</option>
              {boms?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name} (V{b.active_version})
                </option>
              ))}
            </select>
            {errors.bom_template_id && (
              <p className="text-xs text-red-500 font-medium">{errors.bom_template_id.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ngày bắt đầu dự kiến</label>
            <input
              type="date"
              {...register('start_date')}
              className="field-input w-full min-h-[44px]"
            />
          </div>

          {/* Targets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Sản lượng mục tiêu (m) <span className="text-red-500">*</span></label>
            <input
              type="number"
              step="0.01"
              {...register('target_quantity_m', { valueAsNumber: true })}
              className={`field-input w-full min-h-[44px] ${errors.target_quantity_m ? 'is-error' : ''}`}
            />
            {errors.target_quantity_m && (
              <p className="text-xs text-red-500 font-medium">{errors.target_quantity_m.message}</p>
            )}
          </div>

          {/* Target Weight */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Khối lượng dự kiến (kg)</label>
            <input
              type="number"
              step="0.01"
              {...register('target_weight_kg', { valueAsNumber: true })}
              className={`field-input w-full min-h-[44px] ${errors.target_weight_kg ? 'is-error' : ''}`}
            />
            <p className="text-[0.7rem] text-neutral-400 italic">Hệ thống sẽ tự tính từ BOM nếu để trống</p>
            {errors.target_weight_kg && (
              <p className="text-xs text-red-500 font-medium">{errors.target_weight_kg.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ghi chú sản xuất</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Hướng dẫn kỹ thuật hoặc ghi chú đặc biệt cho xưởng..."
              className="field-textarea w-full p-3 text-sm min-h-[100px]"
            />
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="modal-footer">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 sm:flex-none h-12 min-w-[120px] order-2 sm:order-1"
          disabled={createMutation.isPending}
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          className="btn-primary flex-1 sm:flex-none h-12 min-w-[200px] order-1 sm:order-2"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Đang tạo...' : 'Xác nhận tạo Lệnh SX'}
        </button>
      </div>
    </form>
  );
}
