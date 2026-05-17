import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';
import {
  useFabricCatalogs,
  useYarnCatalogs,
  useDraftBom,
  useUpdateDraftBom,
} from '@/application/production';
import { bomTemplateSchema, BomTemplateFormData } from '@/schema/bom.schema';

import { BomTemplate } from './types';
import { BomBasicInfoFields } from './components/BomBasicInfoFields';
import { BomYarnListFields } from './components/BomYarnListFields';
import { BomSummaryBar } from './components/BomSummaryBar';
import { useBomAutoCalculations } from './hooks/useBomAutoCalculations';

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
    bom_yarn_items: initialData?.bom_yarn_items?.map((y) => ({
      id: y.id,
      yarn_catalog_id: y.yarn_catalog_id,
      ratio_pct: y.ratio_pct,
      consumption_kg_per_m: y.consumption_kg_per_m,
      notes: y.notes,
      sort_order: y.sort_order,
    })) || [
      {
        yarn_catalog_id: '',
        ratio_pct: 100,
        consumption_kg_per_m: 0.5,
        sort_order: 0,
      },
    ],
  };

  const fabricOptions = useMemo(
    () =>
      fabricCatalogs.map((fb) => ({
        value: fb.id,
        label: `${fb.code} — ${fb.name}`,
        code: fb.code,
      })),
    [fabricCatalogs],
  );

  const yarnOptions = useMemo(
    () =>
      yarnCatalogs.map((y) => ({
        value: y.id,
        label: `${y.code} — ${y.name} (${y.composition})`,
        code: y.code,
      })),
    [yarnCatalogs],
  );

  const formMethods = useForm<BomTemplateFormData>({
    resolver: zodResolver(bomTemplateSchema),
    defaultValues,
  });

  // Attach business logic hook for code generation and auto consumption calculation
  useBomAutoCalculations({
    form: formMethods,
    fabricCatalogs,
    yarnCatalogs,
    isEdit,
  });

  const onSubmit = async (data: BomTemplateFormData) => {
    try {
      if (isEdit) {
        await updateDraft.mutateAsync({
          id: initialData.id,
          data,
        });
        toast.success('Cập nhật định mức thành công!');
      } else {
        await createDraft.mutateAsync(data);
        toast.success('Tạo bản nháp định mức thành công!');
      }
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error('Có lỗi xảy ra: ' + msg);
    }
  };

  return (
    <FormProvider {...formMethods}>
      <div className="panel-card card-flush">
        {/* Header */}
        <div className="card-header-area">
          <div className="flex items-center gap-3">
            <button
              className="btn-icon"
              type="button"
              onClick={onCancel}
              title="Quay lại"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <span className="font-bold text-lg">
              {isEdit ? 'Cập nhật bản nháp' : 'Tạo bản nháp định mức (BOM)'}
            </span>
          </div>
        </div>

        {/* Form content */}
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="p-5">
          <BomBasicInfoFields fabricOptions={fabricOptions} />

          <BomYarnListFields yarnOptions={yarnOptions} />

          <BomSummaryBar />

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-border">
            <Button
              variant="secondary"
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Lưu bản nháp
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
