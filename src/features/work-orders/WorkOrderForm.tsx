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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Work Order Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Mã Lệnh Sản Xuất</label>
          <input
            {...register('work_order_number')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.work_order_number && (
            <p className="mt-1 text-sm text-red-600">{errors.work_order_number.message}</p>
          )}
        </div>

        {/* Order ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Liên kết Đơn Hàng (Tùy chọn)</label>
          <select
            {...register('order_id')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="none">-- Không liên kết (Sản xuất dự trữ) --</option>
            {orders?.data?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.order_number} - {o.customers?.name}
              </option>
            ))}
          </select>
          {errors.order_id && (
            <p className="mt-1 text-sm text-red-600">{errors.order_id.message}</p>
          )}
        </div>

        {/* BOM Template ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Công thức BOM</label>
          <select
            {...register('bom_template_id')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">-- Chọn công thức dệt --</option>
            {boms?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} - {b.name} (V{b.active_version})
              </option>
            ))}
          </select>
          {errors.bom_template_id && (
            <p className="mt-1 text-sm text-red-600">{errors.bom_template_id.message}</p>
          )}
        </div>

        {/* Targets */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sản lượng kỳ vọng (m)</label>
            <input
              type="number"
              step="0.01"
              {...register('target_quantity_m', { valueAsNumber: true })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {errors.target_quantity_m && (
              <p className="mt-1 text-sm text-red-600">{errors.target_quantity_m.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Khối lượng mộc (kg)</label>
            <input
              type="number"
              step="0.01"
              {...register('target_weight_kg', { valueAsNumber: true })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {errors.target_weight_kg && (
              <p className="mt-1 text-sm text-red-600">{errors.target_weight_kg.message}</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu dự kiến</label>
          <input
            type="date"
            {...register('start_date')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày hoàn thành dự kiến</label>
          <input
            type="date"
            {...register('end_date')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
        <textarea
          rows={3}
          {...register('notes')}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Ghi chú thêm cho bộ phận kỹ thuật dệt"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
        >
          {createMutation.isPending ? 'Đang tạo lệnh...' : 'Tạo Lệnh Sản Xuất'}
        </button>
      </div>
    </form>
  );
}
