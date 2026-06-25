import { Icon } from '@/shared/components';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import { useFabricGalleryManager } from '@/features/fabric-catalog/hooks/useFabricGalleryManager';
import { FabricImageGalleryCard } from '@/features/fabric-catalog/components/FabricImageGalleryCard';

export function FabricImageGalleryEditor() {
  const {
    fields,
    register,
    isUploading,
    uploadingIndex,
    handleFileUpload,
    handleRemove,
    warnings,
  } = useFabricGalleryManager();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {LABELS.GALLERY_TITLE}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{LABELS.GALLERY_DESC}</p>
        </div>

        <label
          className={`relative cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 transition-colors flex items-center gap-2 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Icon name="Upload" className="w-4 h-4 text-primary" />
          <span>{LABELS.GALLERY_UPLOAD}</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            multiple
            onChange={async (e) => {
              if (!e.target.files?.length) return;
              for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files.item(i);
                if (file) {
                  await handleFileUpload(file);
                }
              }
              e.target.value = ''; // reset
            }}
          />
        </label>
      </div>

      {warnings.showWarnings && (
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs font-medium border border-yellow-200 flex items-start gap-2">
          <Icon name="AlertTriangle" className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">{LABELS.GALLERY_SEO_WARNING}</p>
            <ul className="list-disc pl-4 mt-1 opacity-90">
              {!warnings.hasSwatch && <li>{LABELS.GALLERY_WARNING_SWATCH}</li>}
              {!warnings.hasSurface && (
                <li>{LABELS.GALLERY_WARNING_SURFACE}</li>
              )}
              {!warnings.hasApplication && (
                <li>{LABELS.GALLERY_WARNING_APPLICATION}</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {fields.length === 0 && !isUploading && (
        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Icon name="Image" className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">
            {LABELS.GALLERY_EMPTY}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {LABELS.GALLERY_EMPTY_HINT}
          </p>
        </div>
      )}

      {fields.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 items-stretch">
          {fields.map((field, index) => (
            <FabricImageGalleryCard
              key={field.id}
              id={field.id}
              index={index}
              imageUrl={field.image_url}
              altText={field.alt_text}
              register={register}
              onRemove={handleRemove}
            />
          ))}

          {isUploading && uploadingIndex !== null && (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 aspect-[4/3]">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-xs font-semibold text-slate-500">
                {LABELS.GALLERY_UPLOADING}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
