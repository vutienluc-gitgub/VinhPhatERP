import { useFormContext, Controller } from 'react-hook-form';

import { Combobox } from '@/shared/components';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import {
  LABELS,
  STATUS_OPTIONS,
} from '@/features/fabric-catalog/fabric-catalog.constants';

import { FabricPublicSeoSection } from './public-tab-sections/FabricPublicSeoSection';

type FabricAdminTabProps = {
  publicUrl: string;
  isSlugEditing: boolean;
  handleSlugEditStart: () => void;
  handleSlugEditCancel: () => void;
  handleCopyLink: () => void;
  handleDownloadQR: () => void;
  handlePrintQR: () => void;
};

export function FabricAdminTab({
  publicUrl,
  isSlugEditing,
  handleSlugEditStart,
  handleSlugEditCancel,
  handleCopyLink,
  handleDownloadQR,
  handlePrintQR,
}: FabricAdminTabProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border border-default shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
            {LABELS.ADMIN_GENERAL_CONFIG}
          </h3>
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>{LABELS.STATUS}</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={STATUS_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.status}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="fc-notes">{LABELS.NOTES_LABEL}</label>
          <textarea
            id="fc-notes"
            className="field-textarea"
            rows={4}
            placeholder={LABELS.NOTES_PLACEHOLDER}
            {...register('notes')}
          />
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-default shadow-sm p-6">
        <FabricPublicSeoSection
          publicUrl={publicUrl}
          isSlugEditing={isSlugEditing}
          handleSlugEditStart={handleSlugEditStart}
          handleSlugEditCancel={handleSlugEditCancel}
          handleCopyLink={handleCopyLink}
          handleDownloadQR={handleDownloadQR}
          handlePrintQR={handlePrintQR}
        />
      </div>
    </div>
  );
}
