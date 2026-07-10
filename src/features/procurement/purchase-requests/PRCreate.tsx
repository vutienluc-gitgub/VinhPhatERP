import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';

import { Button, Icon, Badge } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { getErrorMessage } from '@/shared/utils/error';
import { useCreatePurchaseRequest } from '@/application/procurement/usePurchaseRequests';
import {
  prHeaderSchema,
  prHeaderDefaults,
  PR_PRIORITIES,
} from '@/schema/purchase-request.schema';
import type { PrHeaderFormValues } from '@/schema/purchase-request.schema';

import {
  PR_LABELS,
  PR_PRIORITY_LABELS,
  UOM_OPTIONS,
} from './purchase-requests.constants';

const PRIORITY_OPTIONS = PR_PRIORITIES.map((p) => ({
  value: p,
  label: PR_PRIORITY_LABELS[p] ?? p,
}));

export function PRCreate() {
  const navigate = useNavigate();
  const createMutation = useCreatePurchaseRequest();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PrHeaderFormValues>({
    resolver: zodResolver(prHeaderSchema),
    defaultValues: prHeaderDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const isPending = isSubmitting || createMutation.isPending;

  const onSubmit = useCallback(
    async (values: PrHeaderFormValues) => {
      try {
        await createMutation.mutateAsync(values);
        navigate('/purchase-requests');
      } catch (error) {
        console.error('[CreatePRError]', error);
      }
    },
    [createMutation, navigate],
  );

  return (
    <div className="page-container">
      <div className="card-header-area">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-surface-subtle transition-colors"
            onClick={() => navigate('/purchase-requests')}
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">{PR_LABELS.CREATE_TITLE}</h1>
            <p className="text-sm text-muted">{PR_LABELS.CREATE_DESCRIPTION}</p>
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
        id="pr-create-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="p-4 md:p-6 space-y-6"
      >
        {/* ── Header Fields ── */}
        <div className="panel-card p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-field">
              <label htmlFor="requester_dept">
                {PR_LABELS.FIELD_DEPT} <span className="field-required">*</span>
              </label>
              <input
                id="requester_dept"
                type="text"
                className={`field-input${errors.requester_dept ? ' is-error' : ''}`}
                placeholder={PR_LABELS.FIELD_DEPT_PLACEHOLDER}
                {...register('requester_dept')}
              />
              {errors.requester_dept && (
                <span className="field-error">
                  {errors.requester_dept.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="priority">{PR_LABELS.FIELD_PRIORITY}</label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={PRIORITY_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="form-field mt-4">
            <label htmlFor="notes">{PR_LABELS.FIELD_NOTES}</label>
            <textarea
              id="notes"
              className="field-input"
              rows={2}
              placeholder={PR_LABELS.FIELD_NOTES_PLACEHOLDER}
              {...register('notes')}
            />
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="panel-card">
          <div className="p-4 md:p-6 flex items-center justify-between border-b border-border">
            <h2 className="text-lg font-semibold">
              {PR_LABELS.ITEM_SECTION_TITLE}
            </h2>
            <Badge variant="info">{fields.length}</Badge>
          </div>

          {errors.items?.root && (
            <div className="px-4 md:px-6 pt-3">
              <p className="error-inline">{errors.items.root.message}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-subtle">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium min-w-[180px]">
                    {PR_LABELS.ITEM_MATERIAL_NAME}{' '}
                    <span className="field-required">*</span>
                  </th>
                  <th className="px-3 py-2 text-left font-medium min-w-[140px]">
                    {PR_LABELS.ITEM_SPECS}
                  </th>
                  <th className="px-3 py-2 text-left font-medium min-w-[100px]">
                    {PR_LABELS.ITEM_QTY}{' '}
                    <span className="field-required">*</span>
                  </th>
                  <th className="px-3 py-2 text-left font-medium min-w-[100px]">
                    {PR_LABELS.ITEM_UOM}{' '}
                    <span className="field-required">*</span>
                  </th>
                  <th className="px-3 py-2 text-left font-medium min-w-[130px]">
                    {PR_LABELS.ITEM_EXPECTED_DATE}
                  </th>
                  <th className="px-3 py-2 text-left font-medium min-w-[160px]">
                    {PR_LABELS.ITEM_PURPOSE}
                  </th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const itemErrors = errors.items?.[index];
                  return (
                    <tr
                      key={field.id}
                      className="border-b border-border/50 hover:bg-surface-subtle/30 transition-colors"
                    >
                      <td className="px-3 py-2 text-muted font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          className={`field-input text-sm${itemErrors?.material_name ? ' is-error' : ''}`}
                          placeholder={PR_LABELS.ITEM_MATERIAL_NAME_PLACEHOLDER}
                          {...register(`items.${index}.material_name`)}
                        />
                        {itemErrors?.material_name && (
                          <span className="field-error text-xs">
                            {itemErrors.material_name.message}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          className="field-input text-sm"
                          placeholder={PR_LABELS.ITEM_SPECS_PLACEHOLDER}
                          {...register(`items.${index}.material_specs`)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`field-input text-sm${itemErrors?.qty_required ? ' is-error' : ''}`}
                          {...register(`items.${index}.qty_required`, {
                            valueAsNumber: true,
                          })}
                        />
                        {itemErrors?.qty_required && (
                          <span className="field-error text-xs">
                            {itemErrors.qty_required.message}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Controller
                          name={`items.${index}.uom`}
                          control={control}
                          render={({ field: uomField }) => (
                            <Combobox
                              options={UOM_OPTIONS}
                              value={uomField.value}
                              onChange={uomField.onChange}
                              hasError={!!itemErrors?.uom}
                            />
                          )}
                        />
                        {itemErrors?.uom && (
                          <span className="field-error text-xs">
                            {itemErrors.uom.message}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          className="field-input text-sm"
                          {...register(`items.${index}.expected_date`)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          className="field-input text-sm"
                          placeholder={PR_LABELS.ITEM_PURPOSE_PLACEHOLDER}
                          {...register(`items.${index}.purpose`)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                            title={PR_LABELS.ITEM_REMOVE}
                            onClick={() => remove(index)}
                          >
                            <Icon name="Trash2" size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                append({
                  material_name: '',
                  material_specs: '',
                  qty_required: 0,
                  uom: 'kg',
                  expected_date: '',
                  purpose: '',
                })
              }
            >
              <Icon name="Plus" size={16} className="mr-1.5" />
              {PR_LABELS.ITEM_ADD}
            </Button>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/purchase-requests')}
            disabled={isPending}
          >
            {PR_LABELS.CANCEL_BUTTON}
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isPending}
            disabled={isPending}
          >
            <Icon name="Save" size={16} className="mr-1.5" />
            {PR_LABELS.SUBMIT_BUTTON}
          </Button>
        </div>
      </form>
    </div>
  );
}
