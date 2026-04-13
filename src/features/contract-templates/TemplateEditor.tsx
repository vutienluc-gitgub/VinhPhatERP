import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { Icon } from '@/shared/components';

import {
  TEMPLATE_PLACEHOLDERS,
  updateTemplate,
} from './contract-templates.module';
import type { ContractTemplate } from './contract-templates.module';

// ── Schema ───────────────────────────────────────────────────────────────────

const editorSchema = z.object({
  name: z.string().trim().min(1, 'Ten mau khong duoc de trong'),
  content: z.string().min(1, 'Noi dung mau khong duoc de trong'),
});

type EditorValues = z.infer<typeof editorSchema>;

// ── Props ────────────────────────────────────────────────────────────────────

type TemplateEditorProps = {
  template: ContractTemplate;
  onSaved: (updated: ContractTemplate) => void;
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
    resolver: zodResolver(editorSchema),
    defaultValues: {
      name: template.name,
      content: template.content,
    },
  });

  function onSubmit(values: EditorValues) {
    setPendingValues(values);
    setShowConfirm(true);
  }

  async function handleConfirm() {
    if (!pendingValues) return;
    try {
      const updated = await updateTemplate(template.id, pendingValues);
      toast.success('Luu mau hop dong thanh cong');
      setShowConfirm(false);
      setPendingValues(null);
      onSaved(updated);
    } catch (err) {
      toast.error((err as Error).message ?? 'Co loi xay ra');
      setShowConfirm(false);
      setPendingValues(null);
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
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 flex gap-3 items-start">
          <Icon
            name="AlertTriangle"
            size={20}
            className="text-amber-500 shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              Thay doi chi ap dung cho hop dong moi
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Cac hop dong da tao truoc do se khong bi anh huong. Ban co chac
              muon luu?
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                className="btn-primary text-sm py-1.5 px-3"
                onClick={() => void handleConfirm()}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Dang luu...' : 'Xac nhan luu'}
              </button>
              <button
                type="button"
                className="btn-secondary text-sm py-1.5 px-3"
                onClick={handleCancelConfirm}
                disabled={isSubmitting}
              >
                Huy
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Template name */}
          <div className="form-field">
            <label htmlFor="template-name">
              Ten mau <span className="field-required">*</span>
            </label>
            <input
              id="template-name"
              type="text"
              className={`field-input${errors.name ? ' is-error' : ''}`}
              {...register('name')}
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>

          {/* Placeholder reference */}
          <div className="form-field">
            <label>Placeholders co san</label>
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
              Sao chep placeholder vao noi dung de tu dong dien du lieu khi tao
              hop dong.
            </p>
          </div>

          {/* Content editor */}
          <div className="form-field">
            <label htmlFor="template-content">
              Noi dung HTML <span className="field-required">*</span>
            </label>
            <textarea
              id="template-content"
              className={`field-textarea font-mono text-sm${errors.content ? ' is-error' : ''}`}
              rows={20}
              placeholder="<p>Noi dung hop dong voi {{placeholder}}...</p>"
              {...register('content')}
            />
            {errors.content && (
              <span className="field-error">{errors.content.message}</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-border">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Huy
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || !isDirty || showConfirm}
          >
            Luu thay doi
          </button>
        </div>
      </form>
    </div>
  );
}
