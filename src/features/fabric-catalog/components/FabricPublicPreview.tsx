import { useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components/Icon';
import { MoneyText } from '@/shared/value';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

export function FabricPublicPreview() {
  const { watch } = useFormContext<FabricCatalogFormValues>();

  const isPublic = watch('is_public');
  const name = watch('name') || LABELS.NA;
  const code = watch('code') || LABELS.NA;
  const imageUrl = watch('image_url');

  const moq = watch('b2b_planner.minimum_order_qty_kg');
  const pricingTiers = watch('pricing_tiers') || [];
  const stockDisplay = watch('b2b_planner.public_stock_display');
  // Temporary hardcode for stockQty until inventory is implemented
  const stockQty = 150;

  const hasSample = watch('b2b_planner.trust_has_sample');
  const fastDelivery = watch('b2b_planner.trust_fast_delivery');
  const techSupport = watch('b2b_planner.trust_tech_support');

  const firstTierPrice =
    pricingTiers.length > 0 ? pricingTiers[0]?.unit_price : null;

  return (
    <div className="flex flex-col items-center py-6 bg-slate-50 rounded-xl mt-4 border border-slate-200">
      <h3 className="text-sm font-medium text-slate-500 mb-6 flex items-center gap-2">
        <Icon name="Smartphone" size={16} className="text-slate-400" />{' '}
        {LABELS.PREVIEW_TITLE}
      </h3>

      {/* Mobile Frame Container */}
      <div className="relative w-[320px] h-[640px] border-[6px] border-slate-800 rounded-[2.5rem] shadow-2xl bg-white overflow-hidden flex flex-col">
        {/* Hardware Elements */}
        {/* Top Notch (Dynamic Island / iPhone style) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-20 flex justify-center items-center">
          <div className="w-12 h-1.5 bg-slate-900 rounded-full opacity-50"></div>
          <div className="w-2 h-2 bg-indigo-900/40 rounded-full ml-2 absolute right-3"></div>
        </div>

        {/* Status Bar Fake */}
        <div className="h-12 w-full pt-2 px-6 flex justify-between items-center text-[10px] font-bold text-slate-800 z-10 relative bg-white">
          <span>9:41</span>
          <div className="flex gap-1 items-center">
            <Icon name="Wifi" size={12} />
            <Icon name="Battery" size={14} />
          </div>
        </div>

        {/* Screen Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-4 relative custom-scrollbar">
          {/* Header Image Area */}
          <div className="aspect-square bg-slate-100 flex flex-col items-center justify-center relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <Icon name="Image" size={48} className="text-slate-300 mb-2" />
                <span className="text-sm text-slate-400 font-medium">
                  {LABELS.PREVIEW_NO_IMAGE}
                </span>
              </>
            )}

            {/* Overlay indicators on image */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                {LABELS.PREVIEW_B2B_PORTAL}
              </span>
            </div>
            <div className="absolute bottom-4 right-4">
              <button className="w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-600">
                <Icon name="Share2" size={14} />
              </button>
            </div>
          </div>

          {/* Product Header Info */}
          <div className="p-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg text-slate-800 leading-tight">
                  {name}
                </h4>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-1 font-medium">
                  <Icon name="Tag" size={12} /> {code}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing & Order Info Card */}
          <div className="mx-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {LABELS.PREVIEW_PRICE_REF}
              </span>
              {firstTierPrice ? (
                <div className="text-right">
                  <span className="text-xs text-slate-500 mr-1">
                    {LABELS.PREVIEW_PRICE_PREFIX}
                  </span>
                  <span className="text-lg font-bold text-rose-600">
                    <MoneyText value={Number(firstTierPrice)} />
                    <span className="text-xs text-slate-500 font-medium">
                      /{LABELS.PREVIEW_UNIT_KG}
                    </span>
                  </span>
                </div>
              ) : (
                <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {LABELS.PREVIEW_CONTACT_PRICE}
                </span>
              )}
            </div>

            <div className="h-px bg-slate-200 w-full my-1"></div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Icon name="Package" size={12} /> {LABELS.PREVIEW_MOQ_LABEL}
              </span>
              <span className="text-sm font-bold text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">
                {moq || 0} {LABELS.PREVIEW_UNIT_KG}
              </span>
            </div>

            {/* Stock Display Logic */}
            {stockDisplay !== 'none' && (
              <>
                <div className="h-px bg-slate-200 w-full my-1"></div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs font-medium text-slate-500">
                    {LABELS.PREVIEW_STOCK_CONDITION}
                  </span>
                  {stockDisplay === 'status' && (
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${stockQty > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                    >
                      {stockQty > 0 ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  )}
                  {stockDisplay === 'quantity' && (
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Sẵn {stockQty || 0} {LABELS.PREVIEW_UNIT_KG}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Trust Signals (Characteristics) */}
          {(hasSample || fastDelivery || techSupport) && (
            <div className="mt-4 border-y border-slate-100 bg-white px-4 py-3 grid gap-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {LABELS.PREVIEW_SERVICES}
              </span>
              {hasSample && (
                <div className="flex items-center text-sm font-medium text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center mr-3">
                    <Icon
                      name="Check"
                      size={12}
                      className="text-emerald-600"
                      strokeWidth={3}
                    />
                  </div>
                  {LABELS.TRUST_HAS_SAMPLE}
                </div>
              )}
              {fastDelivery && (
                <div className="flex items-center text-sm font-medium text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center mr-3">
                    <Icon
                      name="Check"
                      size={12}
                      className="text-emerald-600"
                      strokeWidth={3}
                    />
                  </div>
                  {LABELS.TRUST_FAST_DELIVERY}
                </div>
              )}
              {techSupport && (
                <div className="flex items-center text-sm font-medium text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center mr-3">
                    <Icon
                      name="Check"
                      size={12}
                      className="text-emerald-600"
                      strokeWidth={3}
                    />
                  </div>
                  {LABELS.TRUST_TECH_SUPPORT}
                </div>
              )}
            </div>
          )}

          {/* Padding for bottom CTA */}
          <div className="h-20"></div>
        </div>

        {/* Sticky Bottom CTA */}
        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md px-4 py-4 border-t border-slate-100 z-10">
          <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-slate-900/20 transition-all flex justify-center items-center gap-2">
            {LABELS.PREVIEW_CONTACT_ORDER} <Icon name="ArrowRight" size={16} />
          </button>
        </div>

        {/* Overlay if not public */}
        {!isPublic && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-30 transition-all">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-[80%]">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
                <Icon name="EyeOff" size={24} />
              </div>
              <span className="text-slate-800 font-bold mb-1">
                {LABELS.PREVIEW_HIDDEN}
              </span>
              <span className="text-slate-500 text-xs">
                {LABELS.PREVIEW_HIDDEN_DESC}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
