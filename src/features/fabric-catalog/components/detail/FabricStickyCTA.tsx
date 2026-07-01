import { Icon } from '@/shared/components';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import {
  PUBLIC_PAGE_LABELS as LABELS,
  HOTLINE,
} from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricStickyCTAProps {
  fabric: Partial<FabricCatalog>;
  canOpenERP: boolean;
  canOrder: boolean;
  zaloQuoteUrl: string;
  onRequestSample: () => void;
}

export function FabricStickyCTA({
  fabric,
  canOpenERP,
  canOrder,
  zaloQuoteUrl,
  onRequestSample,
}: FabricStickyCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.08)] z-40">
      <div className="flex gap-2 max-w-md mx-auto">
        {canOpenERP ? (
          <a
            href={`/fabric-catalog/${fabric.slug}`}
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-2 rounded-xl transition-colors"
          >
            <Icon name="ExternalLink" className="w-5 h-5" />
            <span className="text-[10px] font-semibold">
              {LABELS.openInErp}
            </span>
          </a>
        ) : canOrder ? (
          <a
            href={`/portal/fabric-catalog?search=${fabric.code}`}
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-2.5 px-2 rounded-xl transition-colors"
          >
            <Icon name="ShoppingCart" className="w-5 h-5" />
            <span className="text-[10px] font-semibold text-center leading-tight">
              {LABELS.orderViaPortal}
            </span>
          </a>
        ) : (
          <a
            href={`tel:${HOTLINE}`}
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-2 rounded-xl transition-colors"
          >
            <Icon name="Phone" className="w-5 h-5" />
            <span className="text-xs font-semibold">{LABELS.callNow}</span>
          </a>
        )}
        <button
          onClick={() => {
            if (zaloQuoteUrl) {
              window.open(zaloQuoteUrl, '_blank');
            }
          }}
          className="flex-[2] flex flex-col items-center justify-center gap-1 bg-[#0068ff]/10 hover:bg-[#0068ff]/20 text-[#0068ff] border border-[#0068ff]/20 py-2.5 px-2 rounded-xl transition-colors"
        >
          <Icon name="MessageCircle" className="w-5 h-5" />
          <span className="text-xs font-semibold">{LABELS.zaloQuote}</span>
        </button>
        <button
          onClick={onRequestSample}
          className="flex-[2] flex flex-col items-center justify-center gap-1 bg-[#0068ff] hover:bg-[#0054cc] text-white py-2.5 px-2 rounded-xl transition-colors shadow-sm shadow-[#0068ff]/30"
        >
          <Icon name="Package" className="w-5 h-5" />
          <span className="text-xs font-semibold">{LABELS.zaloSample}</span>
        </button>
      </div>
    </div>
  );
}
