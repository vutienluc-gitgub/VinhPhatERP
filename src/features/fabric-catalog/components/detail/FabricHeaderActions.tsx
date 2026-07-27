import { Icon } from '@/shared/components';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricHeaderActionsProps {
  canViewWholesale: boolean;
  isAuthenticated: boolean;
  compareCount: number;
  inquiryCartCount: number;
  onOpenCompare: () => void;
  onOpenInquiryCart: () => void;
  onShare: () => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
}

export function FabricHeaderActions({
  canViewWholesale,
  isAuthenticated,
  compareCount,
  inquiryCartCount,
  onOpenCompare,
  onOpenInquiryCart,
  onShare,
  onOpenLogin,
  onSignOut,
}: FabricHeaderActionsProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold text-primary tracking-tight">
          {LABELS.brandName}
        </h1>
        <div className="flex items-center gap-1.5 ml-1">
          {canViewWholesale ? (
            <span className="bg-success-soft text-success text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
              {LABELS.badgeDealer}
            </span>
          ) : (
            <span className="bg-surface-secondary text-muted text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
              {LABELS.badgePublic}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCompare}
          className="relative p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-muted"
          title={LABELS.compareTitle}
        >
          <Icon name="Scale" className="w-5 h-5" />
          {compareCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {compareCount}
            </span>
          )}
        </button>
        <button
          onClick={onOpenInquiryCart}
          className="relative p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-muted"
          title={LABELS.inquiryCartTitle}
        >
          <Icon name="ShoppingCart" className="w-5 h-5" />
          {inquiryCartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger-soft text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {inquiryCartCount}
            </span>
          )}
        </button>
        <button
          onClick={onShare}
          className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-muted"
          title={LABELS.shareTitle}
        >
          <Icon name="Share2" className="w-5 h-5" />
        </button>
        {!isAuthenticated ? (
          <button
            onClick={onOpenLogin}
            className="p-1.5 rounded-lg hover:bg-primary/5 transition-colors text-primary"
            title={LABELS.loginBtn}
          >
            <Icon name="Lock" className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-danger"
            title={LABELS.logoutBtn}
          >
            <Icon name="LogOut" className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
