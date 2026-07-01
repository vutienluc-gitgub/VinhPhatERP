import { Icon } from '@/shared/components';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricHeaderActionsProps {
  canViewWholesale: boolean;
  isAuthenticated: boolean;
  compareCount: number;
  wishlistCount: number;
  onOpenCompare: () => void;
  onOpenWishlist: () => void;
  onShare: () => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
}

export function FabricHeaderActions({
  canViewWholesale,
  isAuthenticated,
  compareCount,
  wishlistCount,
  onOpenCompare,
  onOpenWishlist,
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
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
              {LABELS.badgeDealer}
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
              {LABELS.badgePublic}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCompare}
          className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
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
          onClick={onOpenWishlist}
          className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          title={LABELS.wishlistTitle}
        >
          <Icon name="Heart" className="w-5 h-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </button>
        <button
          onClick={onShare}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          title={LABELS.shareTitle}
        >
          <Icon name="Share2" className="w-5 h-5" />
        </button>
        {!isAuthenticated ? (
          <button
            onClick={onOpenLogin}
            className="text-xs font-semibold text-primary hover:bg-primary/5 px-2 py-1.5 rounded-lg transition-colors"
          >
            {LABELS.loginBtn}
          </button>
        ) : (
          <button
            onClick={onSignOut}
            className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
            title={LABELS.logoutBtn}
          >
            <Icon name="LogOut" className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
