import { Icon, StatusBadge } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricTitleAndBadgesProps {
  fabric: Partial<FabricCatalog>;
  isCompared: boolean;
  isSaved: boolean;
  handleToggleCompare: () => void;
  handleToggleInquiryCart: () => void;
}

export function FabricTitleAndBadges({
  fabric,
  isCompared,
  isSaved,
  handleToggleCompare,
  handleToggleInquiryCart,
}: FabricTitleAndBadgesProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-2 mb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-snug">
            {fabric.name}
          </h2>
          <p className="text-primary font-bold text-lg">{fabric.code}</p>
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={handleToggleCompare}
            className={cn(
              'flex-1 sm:flex-none p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold',
              isCompared
                ? 'bg-slate-100 text-slate-800 border-slate-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            )}
          >
            <Icon name="Scale" className="w-4 h-4" />
            {isCompared ? LABELS.addedCompare : LABELS.addToCompare}
          </button>
          <button
            onClick={handleToggleInquiryCart}
            className={cn(
              'flex-1 sm:flex-none p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold',
              isSaved
                ? 'bg-red-50 text-red-600 border-red-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            )}
          >
            <Icon
              name="ShoppingCart"
              className={cn('w-4 h-4', isSaved && 'fill-current')}
            />
            {isSaved ? LABELS.savedInquiryCart : LABELS.saveInquiryCart}
          </button>
          <StatusBadge
            domain="FABRIC_STOCK"
            status={fabric.status ?? 'unknown'}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <StatusBadge
          domain="FABRIC_SAMPLE"
          status={fabric.commercial?.trust_has_sample ? 'available' : 'none'}
        />
        <StatusBadge
          domain="FABRIC_STOCK"
          status={fabric.commercial?.stock_status || 'OUT_OF_STOCK'}
        />
      </div>
    </div>
  );
}
