import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, ListPlus } from 'lucide-react';
import { bomTemplateSchema, BomTemplateFormData } from './bom.module';
import { BomTemplate } from './types';
import { useFabricCatalogs, useYarnCatalogs, useDraftBom, useUpdateDraftBom } from './useBom';

interface BomFormProps {
  initialData?: BomTemplate;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BomForm({ initialData, onSuccess, onCancel }: BomFormProps) {
  const { data: fabricCatalogs = [] } = useFabricCatalogs();
  const { data: yarnCatalogs = [] } = useYarnCatalogs();
  
  const createDraft = useDraftBom();
  const updateDraft = useUpdateDraftBom();

  const isEdit = !!initialData;
  const isSubmitting = createDraft.isPending || updateDraft.isPending;

  const defaultValues: BomTemplateFormData = {
    code: initialData?.code || '',
    name: initialData?.name || '',
    target_fabric_id: initialData?.target_fabric_id || '',
    target_width_cm: initialData?.target_width_cm || null,
    target_gsm: initialData?.target_gsm || null,
    standard_loss_pct: initialData?.standard_loss_pct || 5,
    notes: initialData?.notes || '',
    bom_yarn_items: initialData?.bom_yarn_items?.map(y => ({
      id: y.id,
      yarn_catalog_id: y.yarn_catalog_id,
      ratio_pct: y.ratio_pct,
      consumption_kg_per_m: y.consumption_kg_per_m,
      notes: y.notes,
      sort_order: y.sort_order,
    })) || [{ yarn_catalog_id: '', ratio_pct: 100, consumption_kg_per_m: 0.5, sort_order: 0 }],
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BomTemplateFormData>({
    resolver: zodResolver(bomTemplateSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'bom_yarn_items',
  });

  const watchItems = watch('bom_yarn_items');
  const totalRatio = watchItems.reduce((acc, curr) => acc + (Number(curr.ratio_pct) || 0), 0);

  const onSubmit = async (data: BomTemplateFormData) => {
    try {
      if (isEdit) {
        await updateDraft.mutateAsync({ id: initialData.id, data });
      } else {
        await createDraft.mutateAsync(data);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra: ' + (err as Error).message);
    }
  };

  return (
    <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 mb-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {isEdit ? 'Cập Nhật Bản Nháp' : 'Tạo Bản Nháp Định Mức (BOM)'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Công thức sẽ ở trạng thái Nháp cho đến khi được duyệt. 
            Tổng phần trăm của các thành phần sợi phải là 100%.
          </p>
          <div className="mt-6">
            <dl className="space-y-4">
              <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                <dt className="text-sm font-medium text-slate-500">Tổng tỉ lệ hiện tại</dt>
                <dd className={`mt-1 text-xl font-semibold tracking-tight ${Math.abs(totalRatio - 100) > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {totalRatio.toFixed(2)}%
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-6 gap-6">
              
              <div className="col-span-6 md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Mã BOM <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...register('code')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="VD: BOM-CT160-001"
                />
                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
              </div>

              <div className="col-span-6 md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Tên BOM <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="VD: Định mức Cotton 65/35..."
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="col-span-6 md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Mã sản phẩm mộc <span className="text-red-500">*</span></label>
                <select
                  {...register('target_fabric_id')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">-- Chọn sản phẩm mộc --</option>
                  {fabricCatalogs.map(fb => (
                    <option key={fb.id} value={fb.id}>{fb.code} - {fb.name}</option>
                  ))}
                </select>
                {errors.target_fabric_id && <p className="mt-1 text-sm text-red-600">{errors.target_fabric_id.message}</p>}
              </div>

              <div className="col-span-6 md:col-span-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Khổ vải (cm)</label>
                  <input
                    type="number"
                    {...register('target_width_cm', { valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Định lượng (gsm)</label>
                  <input
                    type="number"
                    {...register('target_gsm', { valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Hao hụt mặc định (%)</label>
                <input
                  type="number" step="0.01"
                  {...register('standard_loss_pct', { valueAsNumber: true })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="col-span-6 md:col-span-4">
                <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                <input
                  type="text"
                  {...register('notes')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <ListPlus className="w-5 h-5 text-indigo-500" />
                  Thành phần Nguyên Liệu (Sợi)
                </h4>
                <button
                  type="button"
                  onClick={() => append({ yarn_catalog_id: '', ratio_pct: 0, consumption_kg_per_m: 0.5, sort_order: fields.length })}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm nguyên liệu
                </button>
              </div>

              {errors.bom_yarn_items?.root && (
                <div className="mb-4 bg-red-50 p-2 rounded text-red-600 text-sm">
                  {errors.bom_yarn_items.root.message}
                </div>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex-grow grid grid-cols-12 gap-4">
                      
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Loại sợi</label>
                        <select
                          {...register(`bom_yarn_items.${index}.yarn_catalog_id`)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">- Chọn sợi -</option>
                          {yarnCatalogs.map(y => (
                            <option key={y.id} value={y.id}>{y.code} - {y.name} ({y.composition})</option>
                          ))}
                        </select>
                        {errors.bom_yarn_items?.[index]?.yarn_catalog_id && (
                          <p className="mt-1 text-xs text-red-600">{errors.bom_yarn_items[index]?.yarn_catalog_id?.message}</p>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Tỉ lệ (%)</label>
                        <input
                          type="number" step="0.01"
                          {...register(`bom_yarn_items.${index}.ratio_pct`, { valueAsNumber: true })}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {errors.bom_yarn_items?.[index]?.ratio_pct && (
                          <p className="mt-1 text-xs text-red-600">{errors.bom_yarn_items[index]?.ratio_pct?.message}</p>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Tiêu hao (kg/m)</label>
                        <input
                          type="number" step="0.0001"
                          {...register(`bom_yarn_items.${index}.consumption_kg_per_m`, { valueAsNumber: true })}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {errors.bom_yarn_items?.[index]?.consumption_kg_per_m && (
                          <p className="mt-1 text-xs text-red-600">{errors.bom_yarn_items[index]?.consumption_kg_per_m?.message}</p>
                        )}
                      </div>
                      
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Xoa dòng"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-200">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
              >
                Huỷ bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu Bản Nháp'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
