import { useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components/Icon';
import { MoneyText } from '@/shared/value';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

export function FabricPublicPreview() {
  const { watch } = useFormContext<FabricCatalogFormValues>();

  const name = watch('name') || LABELS.NA;
  const code = watch('code') || LABELS.NA;
  const imageUrl = watch('image_url');
  const unit = watch('unit') || 'kg';

  const moq = watch('b2b_planner.minimum_order_qty_kg');
  const pricingTiers = watch('pricing_tiers') || [];
  const stockDisplay = watch('b2b_planner.public_stock_display');
  // Temporary hardcode for stockQty until inventory is implemented
  const stockQty = 150;

  const hasSample = watch('b2b_planner.trust_has_sample');
  const fastDelivery = watch('b2b_planner.trust_fast_delivery');
  const techSupport = watch('b2b_planner.trust_tech_support');

  const visibleTiers = pricingTiers.filter((t) => t.is_public_visible);
  const firstTierPrice =
    visibleTiers.length > 0 ? visibleTiers[0]?.unit_price : null;

  return (
    <div className="flex flex-col items-center mt-6">
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
          {LABELS.PREVIEW_TITLE}
        </h3>
      </div>

      <div className="w-full flex justify-center">
        {/* The Live Product Card (Floating) */}
        <div className="w-[320px] bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm border border-slate-200">
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
              <span className="bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200">
                {LABELS.PREVIEW_B2B_PORTAL}
              </span>
            </div>
            <div className="absolute bottom-4 right-4">
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Icon name="Share2" size={14} />
              </button>
            </div>
          </div>

          {/* Product Header Info */}
          <div className="p-4 bg-white border-b border-slate-100">
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
          <div className="p-4 bg-white space-y-3 border-b border-slate-100">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  {LABELS.PREVIEW_PRICE_PREFIX}
                </span>
                <span className="text-xl font-extrabold text-emerald-600 leading-none">
                  {firstTierPrice ? (
                    <MoneyText value={firstTierPrice} suffix={`đ/${unit}`} />
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 block">
                  {LABELS.PREVIEW_MOQ_LABEL}
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {moq || 0} {unit}
                </span>
              </div>
            </div>

            {/* Stock Display */}
            {stockDisplay !== 'none' && (
              <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2 border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700">
                  {stockDisplay === 'status' && LABELS.PREVIEW_STOCK_STATUS}
                  {stockDisplay === 'quantity' && `${stockQty} ${unit} có sẵn`}
                </span>
              </div>
            )}
          </div>

          {/* Trust Signals */}
          {(hasSample || fastDelivery || techSupport) && (
            <div className="p-4 bg-white border-b border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {LABELS.PREVIEW_SERVICES}
              </p>
              <ul className="space-y-1.5 text-xs font-medium text-slate-600">
                {hasSample && (
                  <li className="flex items-center gap-2">
                    <Icon
                      name="CheckCircle2"
                      size={14}
                      className="text-emerald-500"
                    />{' '}
                    {LABELS.TRUST_HAS_SAMPLE}
                  </li>
                )}
                {fastDelivery && (
                  <li className="flex items-center gap-2">
                    <Icon
                      name="CheckCircle2"
                      size={14}
                      className="text-emerald-500"
                    />{' '}
                    {LABELS.TRUST_FAST_DELIVERY}
                  </li>
                )}
                {techSupport && (
                  <li className="flex items-center gap-2">
                    <Icon
                      name="CheckCircle2"
                      size={14}
                      className="text-emerald-500"
                    />{' '}
                    {LABELS.TRUST_TECH_SUPPORT}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="p-4 bg-white">
            <button
              type="button"
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-sm"
            >
              {LABELS.PREVIEW_CONTACT_PRICE}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
