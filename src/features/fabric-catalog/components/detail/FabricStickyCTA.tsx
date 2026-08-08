import { Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import {
  HOTLINE,
  PUBLIC_PAGE_LABELS as LABELS,
} from '@/features/fabric-catalog/fabric-catalog.constants';
import type { CTAButtonConfig } from '@/features/fabric-catalog/hooks/useCTAEngine';
import { trackLeadEvent } from '@/shared/services/analytics';

interface FabricStickyCTAProps {
  fabric: Partial<FabricCatalog>;
  ctaButtons: CTAButtonConfig[];
  displayMOQ: string;
  displayLeadTime: string;
  lowestPrice: number | null;
  onAction: (action: CTAButtonConfig['action']) => void;
}

const VARIANT_CLASSES: Record<CTAButtonConfig['variant'], string> = {
  primary:
    'flex-[2] flex flex-col items-center justify-center gap-1 bg-[#0068ff] hover:bg-[#0054cc] text-inverse-foreground py-2.5 px-2 rounded-xl transition-colors shadow-sm shadow-[#0068ff]/30',
  secondary:
    'flex-[2] flex flex-col items-center justify-center gap-1 bg-[#0068ff]/10 hover:bg-[#0068ff]/20 text-[#0068ff] py-2.5 px-2 rounded-xl transition-colors',
  tertiary:
    'flex-1 flex flex-col items-center justify-center gap-1 bg-surface-secondary hover:bg-surface-secondary text-foreground py-2.5 px-2 rounded-xl transition-colors',
};

export function FabricStickyCTA({
  fabric,
  ctaButtons,
  displayMOQ,
  displayLeadTime,
  lowestPrice,
  onAction,
}: FabricStickyCTAProps) {
  const handleClick = (btn: CTAButtonConfig) => {
    trackLeadEvent(
      btn.action === 'rfq'
        ? 'sticky_cta_click_rfq'
        : btn.action === 'sample'
          ? 'sticky_cta_click_sample'
          : btn.action === 'call'
            ? 'sticky_cta_click_call'
            : 'sticky_cta_click_order',
      {
        fabricCode: fabric.code,
        fabricName: fabric.name,
        leadSource: 'sticky_cta',
      },
    );

    if (btn.action === 'call') {
      window.location.href = `tel:${HOTLINE}`;
      return;
    }

    if (btn.href && (btn.action === 'order' || btn.action === 'erp')) {
      window.location.href = btn.href;
      return;
    }

    onAction(btn.action);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.08)] z-40">
      {/* Value Bar */}
      <div className="flex items-center justify-center gap-4 px-3 py-1.5 bg-surface-secondary max-w-md mx-auto">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Icon name="Package" className="w-3 h-3 text-muted-foreground" />
          <span className="font-semibold">MOQ:</span>
          <span className="font-bold text-foreground">{displayMOQ}</span>
        </div>
        <div className="w-px h-3 bg-surface-secondary" />
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Icon name="Clock" className="w-3 h-3 text-muted-foreground" />
          <span className="font-semibold">Lead:</span>
          <span className="font-bold text-foreground">{displayLeadTime}</span>
        </div>
        {lowestPrice !== null && (
          <>
            <div className="w-px h-3 bg-surface-secondary" />
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Icon name="Tag" className="w-3 h-3 text-muted-foreground" />
              <span className="font-bold text-success">
                {LABELS.fromPrefix} <MoneyText value={lowestPrice} />
                /kg
              </span>
            </div>
          </>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-2 max-w-md mx-auto p-3">
        {ctaButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => handleClick(btn)}
            className={VARIANT_CLASSES[btn.variant]}
          >
            <Icon name={btn.icon} className="w-5 h-5" />
            <span className="text-[10px] font-semibold text-center leading-tight">
              {btn.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
