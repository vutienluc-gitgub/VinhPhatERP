import { Icon } from '@/shared/components';
import { InquiryCartItem } from '@/shared/inquiry-cart';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface InquiryCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Record<string, InquiryCartItem>;
  onRemoveItem: (id: string) => void;
  onRequestSample: () => void;
  onRequestRFQ: () => void;
}

export function InquiryCartDrawer({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onRequestSample,
  onRequestRFQ,
}: InquiryCartDrawerProps) {
  if (!isOpen) return null;

  const itemsList = Object.values(items);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col animate-slide-left">
        <div className="p-4 border-b border-default flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Icon name="ShoppingCart" className="w-5 h-5 text-primary" />
            {LABELS.inquiryCartTitle} ({itemsList.length})
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-surface-secondary text-muted"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {itemsList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted space-y-3">
              <Icon name="PackageOpen" className="w-12 h-12 text-muted" />
              <p className="text-sm">{LABELS.inquiryCartEmpty}</p>
              <button
                onClick={onClose}
                className="text-primary text-sm font-semibold hover:underline"
              >
                {LABELS.inquiryCartContinue}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {itemsList.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 border border-default rounded-xl hover:shadow-sm transition-shadow bg-white group relative"
                >
                  <div className="w-16 h-16 bg-surface-secondary rounded-lg overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <Icon name="Image" className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="text-sm font-bold text-primary truncate">
                      {item.code}
                    </p>
                    <p className="text-xs text-muted truncate">{item.name}</p>
                    {item.color_name && (
                      <p className="text-[10px] bg-surface-secondary text-muted px-1.5 py-0.5 rounded inline-block mt-1">
                        {LABELS.colorViewing.replace(':', '')} {item.color_name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-danger hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    title={LABELS.inquiryCartRemoveTitle}
                  >
                    <Icon name="Trash2" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {itemsList.length > 0 && (
          <div className="p-4 border-t border-default bg-white space-y-2">
            <button
              onClick={onRequestSample}
              className="w-full bg-success-soft hover:bg-success-soft text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Icon name="PackageSearch" className="w-4 h-4" />
              {LABELS.requestSampleTitle}
            </button>
            <button
              onClick={onRequestRFQ}
              className="w-full bg-info-soft hover:bg-info-soft text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Icon name="FileText" className="w-4 h-4" />
              {LABELS.rfqBtn}
            </button>
            <p className="text-[11px] text-center text-muted mt-3">
              {LABELS.inquiryCartNotice}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
