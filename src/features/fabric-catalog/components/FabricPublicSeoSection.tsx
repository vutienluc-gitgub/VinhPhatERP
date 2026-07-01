import { useFormContext } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

type FabricPublicSeoSectionProps = {
  isExpanded: boolean;
  onToggle: () => void;
  publicUrl: string;
  isSlugEditing: boolean;
  handleSlugEditStart: () => void;
  handleSlugEditCancel: () => void;
  handleCopyLink: () => void;
  handleDownloadQR: () => void;
  handlePrintQR: () => void;
};

export function FabricPublicSeoSection({
  isExpanded,
  onToggle,
  publicUrl,
  isSlugEditing,
  handleSlugEditStart,
  handleSlugEditCancel,
  handleCopyLink,
  handleDownloadQR,
  handlePrintQR,
}: FabricPublicSeoSectionProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

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
          <span>{LABELS.SECTION_SEO_QR}</span>
        </div>
      </button>
      {isExpanded && (
        <div className="accordion-content space-y-4">
          {/* Slug */}
          <div className="form-field">
            <label>{LABELS.SLUG_LABEL}</label>

            {!isSlugEditing ? (
              /* Locked slug display */
              <div className="slug-locked">
                <Icon name="Lock" size={14} className="slug-locked__icon" />
                <span className="slug-locked__value">
                  {watchSlug || LABELS.NA}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSlugEditStart}
                >
                  {LABELS.SLUG_EDIT}
                </Button>
              </div>
            ) : (
              /* Editable slug input */
              <div className="flex gap-2">
                <input
                  id="fc-slug"
                  className={`field-input flex-1${errors.slug ? ' is-error' : ''}`}
                  type="text"
                  placeholder={LABELS.SLUG_PLACEHOLDER}
                  {...register('slug')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSlugEditCancel}
                >
                  {LABELS.SLUG_CANCEL}
                </Button>
              </div>
            )}

            {!isSlugEditing && (
              <p className="text-xs text-muted mt-1">{LABELS.SLUG_AUTO_HINT}</p>
            )}

            {errors.slug && (
              <span className="field-error">{errors.slug.message}</span>
            )}

            {/* URL preview */}
            <div className="mt-2 text-sm text-muted flex items-center gap-2 flex-wrap">
              <span>
                {LABELS.PUBLIC_PAGE_LABEL}: {publicUrl}
              </span>
              {watchIsPublic && watchSlug && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                  >
                    {LABELS.ACTION_COPY}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(publicUrl, '_blank')}
                  >
                    {LABELS.ACTION_OPEN_PAGE}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* QR + Actions */}
          {watchIsPublic && watchSlug && (
            <div className="qr-section">
              <div id="qr-container" className="qr-section__code">
                <QRCodeDisplay value={publicUrl} size={160} />
              </div>
              <div className="qr-section__actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDownloadQR}
                >
                  {LABELS.ACTION_DOWNLOAD_QR}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrintQR}
                >
                  {LABELS.ACTION_PRINT_QR}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
