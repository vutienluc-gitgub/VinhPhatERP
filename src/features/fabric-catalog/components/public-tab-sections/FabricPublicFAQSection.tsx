import { useFormContext, useFieldArray } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

const FAQ_SECTION_LABELS = {
  title: 'Câu hỏi thường gặp (FAQ)',
  desc: 'Thêm FAQ riêng cho mẫu vải này. Nếu để trống, hệ thống sẽ hiển thị FAQ mặc định chung.',
  addBtn: 'Thêm câu hỏi',
  questionLabel: 'Câu hỏi',
  answerLabel: 'Câu trả lời',
  questionPlaceholder: 'VD: Vải có bị co sau khi giặt không?',
  answerPlaceholder: 'VD: Có, tỷ lệ co khoảng 3–5% theo chiều dọc.',
  removeTitle: 'Xóa câu hỏi',
  maxReached: 'Đã đạt tối đa 10 câu hỏi.',
  duplicateWarning: 'Câu hỏi đã tồn tại.',
} as const;

const MAX_FAQ_ITEMS = 10;

export function FabricPublicFAQSection() {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'faq_data',
  });

  const watchedFaqData = watch('faq_data') ?? [];
  const isMaxReached = fields.length >= MAX_FAQ_ITEMS;

  const faqErrors = errors.faq_data;

  function isDuplicate(question: string, currentIndex: number): boolean {
    const trimmed = question.trim().toLowerCase();
    if (!trimmed) return false;
    return watchedFaqData.some(
      (item, idx) =>
        idx !== currentIndex && item.question.trim().toLowerCase() === trimmed,
    );
  }

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">
            {FAQ_SECTION_LABELS.title}
          </h3>
          <p className="text-xs text-muted mt-0.5">{FAQ_SECTION_LABELS.desc}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ question: '', answer: '' })}
          disabled={isMaxReached}
        >
          <Icon name="Plus" className="w-4 h-4 mr-1" />
          {FAQ_SECTION_LABELS.addBtn}
        </Button>
      </div>

      {typeof faqErrors?.message === 'string' && (
        <p className="text-xs text-red-500">{faqErrors.message}</p>
      )}

      {isMaxReached && (
        <p className="text-xs text-amber-600">
          {FAQ_SECTION_LABELS.maxReached}
        </p>
      )}

      {fields.length === 0 && (
        <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <Icon
            name="HelpCircle"
            className="w-8 h-8 text-slate-300 mx-auto mb-2"
          />
          <p className="text-sm text-muted">{FAQ_SECTION_LABELS.desc}</p>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => {
          const itemErrors = Array.isArray(faqErrors)
            ? faqErrors[index]
            : undefined;
          const currentQuestion = watchedFaqData[index]?.question ?? '';
          const hasDuplicate = isDuplicate(currentQuestion, index);

          return (
            <div
              key={field.id}
              className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  Q{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  title={FAQ_SECTION_LABELS.removeTitle}
                >
                  <Icon name="X" className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  {FAQ_SECTION_LABELS.questionLabel}
                </label>
                <input
                  {...register(`faq_data.${index}.question`)}
                  placeholder={FAQ_SECTION_LABELS.questionPlaceholder}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  maxLength={120}
                />
                {itemErrors?.question?.message && (
                  <p className="text-xs text-red-500 mt-1">
                    {itemErrors.question.message}
                  </p>
                )}
                {hasDuplicate && (
                  <p className="text-xs text-amber-600 mt-1">
                    {FAQ_SECTION_LABELS.duplicateWarning}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  {FAQ_SECTION_LABELS.answerLabel}
                </label>
                <textarea
                  {...register(`faq_data.${index}.answer`)}
                  placeholder={FAQ_SECTION_LABELS.answerPlaceholder}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y"
                  maxLength={1000}
                />
                {itemErrors?.answer?.message && (
                  <p className="text-xs text-red-500 mt-1">
                    {itemErrors.answer.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {fields.length > 0 && !isMaxReached && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => append({ question: '', answer: '' })}
          className="border-dashed"
        >
          <Icon name="Plus" className="w-4 h-4 mr-1" />
          {FAQ_SECTION_LABELS.addBtn}
        </Button>
      )}
    </div>
  );
}
