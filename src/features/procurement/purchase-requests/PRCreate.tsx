import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { getErrorMessage } from '@/shared/utils/error';
import { useCreatePurchaseRequest } from '@/application/procurement/usePurchaseRequests';
import {
  prHeaderSchema,
  prHeaderDefaults,
  PR_PRIORITIES,
} from '@/schema/purchase-request.schema';
import type { PrHeaderFormValues } from '@/schema/purchase-request.schema';

import { PR_LABELS, PR_PRIORITY_LABELS } from './purchase-requests.constants';
import { PRCreateItemsTable } from './PRCreateItemsTable';

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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PrHeaderFormValues>({
    resolver: zodResolver(prHeaderSchema),
    defaultValues: prHeaderDefaults,
  });

  const isPending = isSubmitting || createMutation.isPending;

  const onSubmit = useCallback(
    (values: PrHeaderFormValues) => {
      createMutation.mutate(values, {
        onSuccess: () => navigate('/purchase-requests'),
      });
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
                className={`field-input${errors.requester_dept ? ' border-danger' : ''}`}
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
        <PRCreateItemsTable
          control={control}
          register={register}
          errors={errors}
          setValue={setValue}
        />

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
