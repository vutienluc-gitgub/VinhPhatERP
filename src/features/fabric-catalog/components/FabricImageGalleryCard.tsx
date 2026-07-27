import type { UseFormRegister, Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { Icon } from '@/shared/components';
import { ComboboxField } from '@/shared/components/ComboboxField';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import {
  LABELS,
  IMAGE_TYPE_MAP,
} from '@/features/fabric-catalog/fabric-catalog.constants';
import { NumericInput } from '@/shared/value';

const IMAGE_TYPES = [
  'SWATCH',
  'SURFACE',
  'BACK',
  'STRETCH',
  'APPLICATION',
  'COMPOSITION',
  'CERTIFICATE',
] as const;

const COMBOBOX_OPTIONS = IMAGE_TYPES.map((type) => ({
  value: type,
  label: IMAGE_TYPE_MAP[type] || type,
}));

type FabricImageGalleryCardProps = {
  id: string;
  index: number;
  imageUrl: string;
  altText: string | null | undefined;
  control: Control<FabricCatalogFormValues>;
  register: UseFormRegister<FabricCatalogFormValues>;
  onRemove: (index: number) => void;
};

export function FabricImageGalleryCard({
  id,
  index,
  imageUrl,
  altText,
  control,
  register,
  onRemove,
}: FabricImageGalleryCardProps) {
  return (
    <div
      key={id}
      className="bg-white rounded-xl border border-default overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row items-stretch"
    >
      <div className="w-full sm:w-48 aspect-[4/3] sm:aspect-square bg-surface-secondary relative group shrink-0 border-b sm:border-b-0 sm:border-r border-default">
        <img
          src={imageUrl}
          alt={altText || LABELS.GALLERY_DEFAULT_ALT}
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-muted hover:text-danger p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all"
          title={LABELS.GALLERY_REMOVE_IMAGE}
        >
          <Icon name="Trash2" className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex-1 bg-slate-50/50">
        <input type="hidden" {...register(`images.${index}.id` as const)} />
        <input
          type="hidden"
          {...register(`images.${index}.image_url` as const)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          <div className="grid grid-cols-[1fr_60px] gap-2">
            <div>
              <label className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">
                {LABELS.GALLERY_IMAGE_TYPE}
              </label>
              <ComboboxField
                name={`images.${index}.type` as const}
                control={control}
                options={COMBOBOX_OPTIONS}
              />
            </div>
            <Controller
              name={`images.${index}.display_order` as const}
              control={control}
              render={({ field }) => (
                <NumericInput
                  className="w-full border-default bg-white text-primary rounded-lg text-xs py-1.5 px-2 focus:ring-1 focus:ring-primary/20 transition-all"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">
              {LABELS.GALLERY_ALT_TEXT}
            </label>
            <input
              type="text"
              placeholder={LABELS.GALLERY_ALT_PLACEHOLDER}
              className="w-full border-default bg-white text-primary rounded-lg text-xs py-1.5 px-3 focus:ring-1 focus:ring-primary/20 transition-all"
              {...register(`images.${index}.alt_text` as const)}
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5 block">
              {LABELS.GALLERY_CAPTION}
            </label>
            <input
              type="text"
              placeholder={LABELS.GALLERY_CAPTION_PLACEHOLDER}
              className="w-full border-default bg-white text-primary rounded-lg text-xs py-1.5 px-3 focus:ring-1 focus:ring-primary/20 transition-all"
              {...register(`images.${index}.caption` as const)}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer bg-white border border-default px-3 py-1.5 rounded-lg hover:border-primary/50 transition-colors w-full sm:w-auto">
              <input
                type="checkbox"
                className="rounded border-muted text-primary focus:ring-primary w-4 h-4"
                {...register(`images.${index}.is_primary` as const)}
              />
              <span className="text-xs font-semibold text-secondary">
                {LABELS.GALLERY_IS_PRIMARY}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
