import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { TEMPLATE_PLACEHOLDERS, CONTRACT_TEMPLATE_LABELS } from '@/schema';
import type { ContractTemplate, ContractType } from '@/schema';
import { Icon, Button } from '@/shared/components';
import { contractTemplateEditorSchema } from '@/schema/contract-template.schema';
import type { ContractTemplateEditorValues } from '@/schema/contract-template.schema';

type EditorValues = ContractTemplateEditorValues;

// ── Props ────────────────────────────────────────────────────────────────────

type TemplateEditorProps = {
  template?: ContractTemplate;
  defaultType?: ContractType;
  onSaved: (data: EditorValues) => Promise<void>;
  onCancel: () => void;
};

// ── Component ────────────────────────────────────────────────────────────────

export function TemplateEditor({
  template,
  onSaved,
  onCancel,
}: TemplateEditorProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState<EditorValues | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditorValues>({
    resolver: zodResolver(contractTemplateEditorSchema),
    defaultValues: {
      name: template?.name ?? '',
      content: template?.content ?? '',
    },
  });

  function onSubmit(values: EditorValues) {
    setPendingValues(values);
    setShowConfirm(true);
  }

  async function handleConfirm() {
    if (!pendingValues) return;
    try {
      await onSaved(pendingValues);
      setShowConfirm(false);
      setPendingValues(null);
    } catch (_err) {
      // Error is handled by parent, but we can catch so we don't crash
      setShowConfirm(false);
    }
  }

  function handleCancelConfirm() {
    setShowConfirm(false);
    setPendingValues(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Confirm dialog */}
      {showConfirm && (
        <div className="p-4 rounded-lg border border-warning bg-amber-50 flex gap-3 items-start">
          <Icon
            name="AlertTriangle"
            size={20}
            className="text-warning shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warning-strong">
              {template
                ? CONTRACT_TEMPLATE_LABELS.CONFIRM_SAVE_TITLE
                : CONTRACT_TEMPLATE_LABELS.CONFIRM_CREATE_TITLE}
            </p>
            <p className="text-xs text-warning-strong mt-1">
              {CONTRACT_TEMPLATE_LABELS.CONFIRM_SAVE_MSG}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="primary"
                type="button"
                className="text-sm py-1.5 px-3"
                onClick={() => void handleConfirm()}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? CONTRACT_TEMPLATE_LABELS.BTN_SAVING
                  : CONTRACT_TEMPLATE_LABELS.BTN_CONFIRM_SAVE}
              </Button>
              <Button
                variant="secondary"
                type="button"
                className="text-sm py-1.5 px-3"
                onClick={handleCancelConfirm}
                disabled={isSubmitting}
              >
                {CONTRACT_TEMPLATE_LABELS.BTN_CANCEL}
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Template name */}
          <div className="form-field">
            <label htmlFor="template-name">
              {CONTRACT_TEMPLATE_LABELS.TEMPLATE_NAME}{' '}
              <span className="field-required">*</span>
            </label>
            <input
              id="template-name"
              type="text"
              className={`field-input${errors.name ? ' border-danger' : ''}`}
              {...register('name')}
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>

          {/* Placeholder reference */}
          <div className="form-field">
            <label>{CONTRACT_TEMPLATE_LABELS.AVAILABLE_PLACEHOLDERS}</label>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-border bg-surface-subtle">
              {TEMPLATE_PLACEHOLDERS.map((p) => (
                <span
                  key={p.key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary border border-primary/20"
                  title={p.label}
                >
                  {`{{${p.key}}}`}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted mt-1">
              {CONTRACT_TEMPLATE_LABELS.PLACEHOLDER_HINT}
            </p>
          </div>

          {/* Content editor */}
          <div className="form-field">
            <label htmlFor="template-content">
              {CONTRACT_TEMPLATE_LABELS.HTML_CONTENT}{' '}
              <span className="field-required">*</span>
            </label>
            <textarea
              id="template-content"
              className={`field-textarea font-mono text-sm${errors.content ? ' border-danger' : ''}`}
              rows={20}
              placeholder="<p>Nội dung hợp đồng với {{placeholder}}...</p>"
              {...register('content')}
            />
            {errors.content && (
              <span className="field-error">{errors.content.message}</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-border">
          <Button
            variant="secondary"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {CONTRACT_TEMPLATE_LABELS.BTN_CANCEL}
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || !isDirty || showConfirm}
          >
            {CONTRACT_TEMPLATE_LABELS.BTN_SAVE}
          </Button>
        </div>
      </form>
    </div>
  );
}
