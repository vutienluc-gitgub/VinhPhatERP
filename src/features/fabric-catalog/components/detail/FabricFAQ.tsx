import {
  PUBLIC_FAQ_ITEMS,
  PUBLIC_PAGE_LABELS,
} from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricFAQItem } from '@/domain/settings/fabric-catalog.types';

interface FabricFAQProps {
  faqItems?: FabricFAQItem[] | null;
}

export function FabricFAQ({ faqItems }: FabricFAQProps) {
  // Use fabric-specific FAQ if available, otherwise fallback to defaults
  const validFabricItems = (faqItems ?? []).filter(
    (item) => item.question?.trim() && item.answer?.trim(),
  );

  const displayItems =
    validFabricItems.length > 0 ? validFabricItems : PUBLIC_FAQ_ITEMS;

  if (displayItems.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-base font-bold text-gray-900 mb-3 uppercase">
        {PUBLIC_PAGE_LABELS.faqTitle}
      </h3>
      <div className="space-y-3">
        {displayItems.map((item, index) => (
          <div
            key={item.question}
            className="bg-slate-50 p-3 rounded-lg text-sm"
          >
            <p className="font-semibold text-gray-900 mb-1">
              Q{index + 1}: {item.question}
            </p>
            <p className="text-gray-700 leading-relaxed">
              A{index + 1}: {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
