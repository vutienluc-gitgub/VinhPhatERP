import { useCallback, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';

import { Button, Icon, Badge } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { getErrorMessage } from '@/shared/utils/error';
import {
  useCreateRFQ,
  usePendingPrItems,
} from '@/application/procurement/useRFQs';
import { rfqSchema, rfqDefaults } from '@/schema/sourcing-rfq.schema';
import type { RfqFormValues } from '@/schema/sourcing-rfq.schema';
import { fetchYarnCatalogOptions } from '@/api/yarn-catalog.api';
import { fetchFabricCatalogOptions } from '@/api/fabric-catalog.api';

import { RFQ_LABELS } from './rfqs.constants';

export function RFQCreate() {
  const navigate = useNavigate();
  const createMutation = useCreateRFQ();
  const { data: pendingItems = [], isLoading: isLoadingItems } =
    usePendingPrItems();

  const [materialOptions, setMaterialOptions] = useState<
    { value: string; label: string; code?: string }[]
  >([]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchYarnCatalogOptions(), fetchFabricCatalogOptions()])
      .then(([yarns, fabrics]) => {
        if (!active) return;
        const mappedYarns = yarns.map((y) => ({
          value: y.id,
          label: y.name,
          code: y.code,
        }));
        const mappedFabrics = fabrics.map((f) => ({
          value: f.id,
          label: f.name,
          code: f.code,
        }));
        setMaterialOptions([...mappedYarns, ...mappedFabrics]);
      })
      .catch((err) => console.error('Failed to load materials', err));

    return () => {
      active = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<RfqFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: rfqDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedPrItemIds = useMemo(
    () => fields.map((f) => f.pr_item_id),
    [fields],
  );
  const isPending = isSubmitting || createMutation.isPending;

  const toggleItem = useCallback(
    (id: string) => {
      const index = fields.findIndex((f) => f.pr_item_id === id);
      if (index >= 0) {
        remove(index);
      } else {
        append({ pr_item_id: id, material_id: '' });
      }
    },
    [fields, append, remove],
  );

  const toggleAll = useCallback(() => {
    if (fields.length === pendingItems.length) {
      remove();
    } else {
      remove();
      const allItems = pendingItems.map((i) => ({
        pr_item_id: i.id,
        material_id: '',
      }));
      append(allItems);
    }
  }, [pendingItems, fields.length, append, remove]);

  const onSubmit = useCallback(
    async (values: RfqFormValues) => {
      try {
        const rfq = await createMutation.mutateAsync({
          values,
          pendingItems,
        });
        navigate(`/sourcing-rfqs/${rfq.id}`);
      } catch (error) {
        console.error('[CreateRFQError]', error);
      }
    },
    [createMutation, navigate, pendingItems],
  );

  return (
    <div className="page-container">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-surface-subtle transition-colors"
            onClick={() => navigate('/sourcing-rfqs')}
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">{RFQ_LABELS.CREATE_TITLE}</h1>
            <p className="text-sm text-muted">
              {RFQ_LABELS.CREATE_DESCRIPTION}
            </p>
          </div>
        </div>
      </div>

      {createMutation.error && (
        <div className="mx-4 md:mx-6 mt-4">
          <p className="error-inline">
            {getErrorMessage(createMutation.error)}
          </p>
        </div>
      )}

      <form
        id="rfq-create-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="p-4 md:p-6 space-y-6"
      >
        {/* ── Header Fields ── */}
        <div className="panel-card p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="title">
                {RFQ_LABELS.FIELD_TITLE}{' '}
                <span className="field-required">*</span>
              </label>
              <input
                id="title"
                type="text"
                className={`field-input${errors.title ? ' border-danger' : ''}`}
                placeholder={RFQ_LABELS.FIELD_TITLE_PLACEHOLDER}
                {...register('title')}
              />
              {errors.title && (
                <span className="field-error">{errors.title.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="deadline_date">
                {RFQ_LABELS.FIELD_DEADLINE}{' '}
                <span className="field-required">*</span>
              </label>
              <input
                id="deadline_date"
                type="datetime-local"
                className={`field-input${errors.deadline_date ? ' border-danger' : ''}`}
                {...register('deadline_date')}
              />
              {errors.deadline_date && (
                <span className="field-error">
                  {errors.deadline_date.message}
                </span>
              )}
            </div>
          </div>

          <div className="form-field mt-4">
            <label htmlFor="notes">{RFQ_LABELS.FIELD_NOTES}</label>
            <textarea
              id="notes"
              className="field-input"
              rows={2}
              placeholder={RFQ_LABELS.FIELD_NOTES_PLACEHOLDER}
              {...register('notes')}
            />
          </div>
        </div>

        {/* ── PR Items Selection ── */}
        <div className="panel-card">
          <div className="p-4 md:p-6 flex items-center justify-between border-b border-border">
            <div>
              <h2 className="text-lg font-semibold">
                {RFQ_LABELS.PR_SELECTION_TITLE}
              </h2>
              <p className="text-sm text-muted">
                {RFQ_LABELS.PR_SELECTION_DESC}
              </p>
            </div>
            <Badge variant="info">
              {fields.length} / {pendingItems.length} {RFQ_LABELS.TXT_SELECTED}
            </Badge>
          </div>

          {errors.items && (
            <div className="px-4 md:px-6 pt-3">
              <p className="error-inline">{errors.items.message}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-subtle">
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary"
                      checked={
                        pendingItems.length > 0 &&
                        fields.length === pendingItems.length
                      }
                      onChange={toggleAll}
                      disabled={isLoadingItems || pendingItems.length === 0}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {RFQ_LABELS.COL_PR_CODE}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {RFQ_LABELS.COL_MAP_MATERIAL}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {RFQ_LABELS.COL_MATERIAL_SPEC}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {RFQ_LABELS.COL_QTY}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoadingItems ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">
                      {RFQ_LABELS.TXT_LOADING_LIST}
                    </td>
                  </tr>
                ) : pendingItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">
                      {RFQ_LABELS.NO_PENDING_ITEMS}
                    </td>
                  </tr>
                ) : (
                  pendingItems.map((item) => {
                    const isSelected = selectedPrItemIds.includes(item.id);
                    const fieldIndex = fields.findIndex(
                      (f) => f.pr_item_id === item.id,
                    );
                    const itemErrors = errors.items?.[fieldIndex];

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-surface-subtle/50 transition-colors ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td
                          className="px-4 py-3"
                          onClick={() => toggleItem(item.id)}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                            checked={isSelected}
                            readOnly
                          />
                        </td>
                        <td
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => !isSelected && toggleItem(item.id)}
                        >
                          <div className="font-mono text-xs font-bold text-primary">
                            {item.pr_no}
                          </div>
                          <div className="font-medium mt-1">
                            {item.material_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 min-w-[250px]">
                          {isSelected ? (
                            <div className="space-y-1">
                              <Controller
                                control={control}
                                name={`items.${fieldIndex}.material_id`}
                                render={({ field }) => (
                                  <Combobox
                                    options={materialOptions}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder={
                                      RFQ_LABELS.PLACEHOLDER_SELECT_MATERIAL
                                    }
                                    className={
                                      itemErrors?.material_id
                                        ? 'border-destructive'
                                        : ''
                                    }
                                  />
                                )}
                              />
                              {itemErrors?.material_id && (
                                <p className="text-xs text-destructive">
                                  {itemErrors.material_id.message}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted italic text-xs">
                              {RFQ_LABELS.TXT_MAP_REQUIRED}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {item.material_specs || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium">
                            {item.qty_required}
                          </span>{' '}
                          {item.uom}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/sourcing-rfqs')}
            disabled={isPending}
          >
            {RFQ_LABELS.CANCEL_BUTTON}
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isPending}
            disabled={isPending || fields.length === 0}
          >
            <Icon name="Save" size={16} className="mr-1.5" />
            {RFQ_LABELS.SUBMIT_BUTTON}
          </Button>
        </div>
      </form>
    </div>
  );
}
