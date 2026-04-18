import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { TEMPLATE_PLACEHOLDERS } from '@/schema';
import type { ContractTemplate, ContractType } from '@/schema';
import { Icon, Button } from '@/shared/components';

// ── Schema ───────────────────────────────────────────────────────────────────

const editorSchema = z.object({
  name: z.string().trim().min(1, 'Tên mẫu không được để trống'),
  content: z.string().min(1, 'Nội dung mẫu không được để trống'),
});

type EditorValues = z.infer<typeof editorSchema>;

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
    resolver: zodResolver(editorSchema),
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
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 flex gap-3 items-start">
          <Icon
            name="AlertTriangle"
            size={20}
            className="text-amber-500 shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              {template ? 'Lưu thay đổi mẫu văn bản' : 'Tạo mới mẫu văn bản'}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Bạn có chắc chắn muốn lưu mẫu này không? Những bản in tiếp theo sẽ
              sử dụng nội dung mới.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="primary"
                type="button"
                className="text-sm py-1.5 px-3"
                onClick={() => void handleConfirm()}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang lưu...' : 'Xác nhận lưu'}
              </Button>
              <Button
                variant="secondary"
                type="button"
                className="text-sm py-1.5 px-3"
                onClick={handleCancelConfirm}
                disabled={isSubmitting}
              >
                Hủy
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
              Tên mẫu <span className="field-required">*</span>
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
            <label>Placeholders có sẵn</label>
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
              Sao chép placeholder vào nội dung để tự động điền dữ liệu khi tạo
              hợp đồng.
            </p>
          </div>

          {/* Content editor */}
          <div className="form-field">
            <label htmlFor="template-content">
              Nội dung HTML <span className="field-required">*</span>
            </label>
            <textarea
              id="template-content"
              className={`field-textarea font-mono text-sm${errors.content ? ' is-error' : ''}`}
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
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || !isDirty || showConfirm}
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
