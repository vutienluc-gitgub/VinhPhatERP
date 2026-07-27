import { useFormContext, Controller } from 'react-hook-form';
import dayjs from 'dayjs';

import { Switch, Button, Icon } from '@/shared/components';
import {
  LABELS,
  PUBLIC_TAB_LABELS as TAB_LABELS,
} from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

type FabricPublicStatusSectionProps = {
  publicUrl: string;
  updatedAt?: string | null;
};

export function FabricPublicStatusSection({
  publicUrl,
  updatedAt,
}: FabricPublicStatusSectionProps) {
  const { control, watch } = useFormContext<FabricCatalogFormValues>();
  const isPublic = watch('is_public');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          {isPublic ? (
            <span className="w-2.5 h-2.5 rounded-full bg-success-soft animate-pulse" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-surface-strong" />
          )}
          {LABELS.PUBLIC_TITLE}
        </h3>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-md ${isPublic ? 'bg-success-soft text-success' : 'bg-surface-secondary text-muted'}`}
        >
          {isPublic ? 'LIVE' : 'DRAFT'}
        </span>
      </div>

      <div className="space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-secondary">
            {LABELS.PUBLIC_DESC}
          </span>
          <Controller
            name="is_public"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        <div className="h-px bg-surface-secondary" />

        {/* Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{TAB_LABELS.LAST_UPDATED}</span>
            <span className="font-medium text-secondary">
              {updatedAt ? dayjs(updatedAt).format('DD MMM YYYY, HH:mm') : '—'}
            </span>
          </div>

          {isPublic && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Public URL</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                >
                  <Icon name="Copy" size={14} className="text-muted" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isPublic && (
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={() => window.open(publicUrl, '_blank')}
          >
            <Icon name="ExternalLink" size={16} className="mr-2" />
            {LABELS.VIEW_PUBLIC_PAGE}
          </Button>
        )}
      </div>
    </div>
  );
}
