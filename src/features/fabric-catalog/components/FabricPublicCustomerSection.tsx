import { useFormContext, Controller } from 'react-hook-form';

import { Switch, Button, Icon } from '@/shared/components';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

type FabricPublicCustomerSectionProps = {
  isExpanded: boolean;
  onToggle: () => void;
  publicUrl: string;
};

export function FabricPublicCustomerSection({
  isExpanded,
  onToggle,
  publicUrl,
}: FabricPublicCustomerSectionProps) {
  const { control, watch, register } =
    useFormContext<FabricCatalogFormValues>();

  const watchIsPublic = watch('is_public');
  const watchSlug = watch('slug');

  return (
    <div className={`accordion-section${isExpanded ? ' is-expanded' : ''}`}>
      <button type="button" className="accordion-header" onClick={onToggle}>
        <div className="accordion-header-title">
          <Icon
            name="ChevronDown"
            className="accordion-header-chevron w-4 h-4"
          />
          <span>{LABELS.SECTION_CUSTOMER}</span>
        </div>
      </button>
      {isExpanded && (
        <div className="accordion-content space-y-4">
          {/* Public toggle */}
          <div className="public-toggle-section">
            <div className="public-toggle-section__text">
              <p className="public-toggle-section__title">
                {LABELS.PUBLIC_TITLE}
              </p>
              <p className="public-toggle-section__desc">
                {LABELS.PUBLIC_DESC}
              </p>
            </div>
            <div className="public-toggle-section__controls">
              <span
                className={`public-status-dot${watchIsPublic ? ' is-active' : ''}`}
              >
                {watchIsPublic ? LABELS.PUBLIC_ON : LABELS.PUBLIC_OFF}
              </span>
              <Controller
                name="is_public"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          </div>

          {/* Stock Display Mode */}
          <div className="form-field">
            <label className="font-semibold block mb-2">
              {LABELS.STOCK_DISPLAY_LABEL}
            </label>
            <div className="stock-display-radio">
              <label className="stock-display-radio-label">
                <input
                  type="radio"
                  value="none"
                  {...register('b2b_planner.public_stock_display')}
                />
                <span>{LABELS.STOCK_DISPLAY_NONE}</span>
              </label>
              <label className="stock-display-radio-label">
                <input
                  type="radio"
                  value="status"
                  {...register('b2b_planner.public_stock_display')}
                />
                <span>{LABELS.STOCK_DISPLAY_STATUS}</span>
              </label>
              <label className="stock-display-radio-label">
                <input
                  type="radio"
                  value="quantity"
                  {...register('b2b_planner.public_stock_display')}
                />
                <span>{LABELS.STOCK_DISPLAY_QUANTITY}</span>
              </label>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="form-field">
            <label className="font-semibold block mb-2">
              {LABELS.TRUST_SIGNALS_LABEL}
            </label>
            <div className="trust-signals-row">
              <label className="trust-signal-checkbox-label">
                <input
                  type="checkbox"
                  {...register('b2b_planner.trust_has_sample')}
                />
                <span>{LABELS.TRUST_HAS_SAMPLE}</span>
              </label>
              <label className="trust-signal-checkbox-label">
                <input
                  type="checkbox"
                  {...register('b2b_planner.trust_fast_delivery')}
                />
                <span>{LABELS.TRUST_FAST_DELIVERY}</span>
              </label>
              <label className="trust-signal-checkbox-label">
                <input
                  type="checkbox"
                  {...register('b2b_planner.trust_tech_support')}
                />
                <span>{LABELS.TRUST_TECH_SUPPORT}</span>
              </label>
            </div>
          </div>

          {/* Xem trang công khai */}
          {watchIsPublic && watchSlug && (
            <Button
              type="button"
              variant="primary"
              className="view-public-btn"
              onClick={() => window.open(publicUrl, '_blank')}
            >
              <Icon name="ExternalLink" className="w-4 h-4 mr-1" />
              {LABELS.VIEW_PUBLIC_PAGE}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
