import { useFormContext } from 'react-hook-form';

import { Button, Icon } from '@/shared/components';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

type FabricPublicSeoSectionProps = {
  publicUrl: string;
  isSlugEditing: boolean;
  handleSlugEditStart: () => void;
  handleSlugEditCancel: () => void;
  handleCopyLink: () => void;
  handleDownloadQR: () => void;
  handlePrintQR: () => void;
};

export function FabricPublicSeoSection({
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
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {LABELS.SECTION_SEO_QR}
        </h3>
      </div>

      <div className="space-y-5">
        {/* Row 1: Slug */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {LABELS.SLUG_LABEL}
          </label>
          {!isSlugEditing ? (
            <div className="flex items-center justify-between bg-slate-50 border border-default px-3 py-2 rounded-lg min-w-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <Icon
                  name="Lock"
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <span className="text-sm font-medium text-muted-foreground truncate">
                  {watchSlug || LABELS.NA}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSlugEditStart}
                className="shrink-0 h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
              >
                {LABELS.SLUG_EDIT}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  id="fc-slug"
                  className={`field-input w-full ${errors.slug ? 'border-danger' : ''}`}
                  type="text"
                  placeholder={LABELS.SLUG_PLACEHOLDER}
                  {...register('slug')}
                />
                {errors.slug && (
                  <span className="text-xs text-danger mt-1 block">
                    {errors.slug.message}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={handleSlugEditCancel}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {LABELS.SLUG_CANCEL}
              </Button>
            </div>
          )}
          {!isSlugEditing && (
            <p className="text-[10px] text-muted-foreground">
              {LABELS.SLUG_AUTO_HINT}
            </p>
          )}
        </div>

        {/* Row 2: URL & Actions */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {LABELS.PUBLIC_PAGE_LABEL}
          </label>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center min-w-0 w-full">
            <div className="text-xs text-muted-foreground break-all p-2 bg-slate-50 rounded border border-default flex-1 min-w-0 w-full">
              {publicUrl}
            </div>

            {watchIsPublic && watchSlug && (
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  title="Copy Link"
                  onClick={handleCopyLink}
                  className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-surface-secondary transition-colors"
                >
                  <Icon name="Copy" size={16} />
                </button>
                <button
                  type="button"
                  title="Open Link"
                  onClick={() => window.open(publicUrl, '_blank')}
                  className="w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-surface-secondary transition-colors"
                >
                  <Icon name="ExternalLink" size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: QR Image */}
        {watchIsPublic && watchSlug && (
          <div className="pt-2 flex items-end justify-between">
            <div id="qr-container" className="p-0 border-none bg-transparent">
              <QRCodeDisplay value={publicUrl} size={100} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Icon name="Download" size={14} /> PNG
              </button>
              <button
                type="button"
                onClick={handlePrintQR}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-2"
              >
                <Icon name="Printer" size={14} /> In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
