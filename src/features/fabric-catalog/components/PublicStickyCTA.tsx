/**
 * @deprecated Use FabricStickyCTA from `components/detail/FabricStickyCTA.tsx` instead.
 * This component is no longer imported anywhere and will be removed after
 * a stable release cycle. See migration: 20260702 B2B Lead Funnel.
 */
import { Icon } from '@/shared/components';
import {
  HOTLINE,
  PUBLIC_PAGE_LABELS as LABELS,
} from '@/features/fabric-catalog/fabric-catalog.constants';

type Props = {
  fabricCode: string;
  fabricName: string;
  activeColorName: string | null;
  activeMOQ: string | null;
};

export function PublicStickyCTA({
  fabricCode,
  fabricName,
  activeColorName,
  activeMOQ,
}: Props) {
  const handleZaloClick = (type: 'quote' | 'sample') => {
    const template =
      type === 'quote' ? LABELS.zaloQuoteMsg : LABELS.zaloSampleMsg;
    const msg = template
      .replace('{code}', fabricCode)
      .replace('{name}', fabricName)
      .replace('{color}', activeColorName || 'Tất cả màu')
      .replace('{moq}', activeMOQ || 'N/A');
    window.open(
      `https://zalo.me/${HOTLINE}?text=${encodeURIComponent(msg)}`,
      '_blank',
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.08)] z-40">
      <div className="flex gap-2 max-w-md mx-auto">
        <a
          href={`tel:${HOTLINE}`}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-2 rounded-xl transition-colors"
        >
          <Icon name="Phone" className="w-5 h-5" />
          <span className="text-xs font-semibold">{LABELS.callNow}</span>
        </a>
        <button
          onClick={() => handleZaloClick('quote')}
          className="flex-[2] flex flex-col items-center justify-center gap-1 bg-[#0068ff]/10 hover:bg-[#0068ff]/20 text-[#0068ff] border border-[#0068ff]/20 py-2.5 px-2 rounded-xl transition-colors"
        >
          <Icon name="MessageCircle" className="w-5 h-5" />
          <span className="text-xs font-semibold">{LABELS.zaloQuote}</span>
        </button>
        <button
          onClick={() => handleZaloClick('sample')}
          className="flex-[2] flex flex-col items-center justify-center gap-1 bg-[#0068ff] hover:bg-[#0054cc] text-white py-2.5 px-2 rounded-xl transition-colors shadow-sm shadow-[#0068ff]/30"
        >
          <Icon name="Package" className="w-5 h-5" />
          <span className="text-xs font-semibold">{LABELS.zaloSample}</span>
        </button>
      </div>
    </div>
  );
}
