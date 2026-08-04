import { FormProvider } from 'react-hook-form';
import { useMemo } from 'react';

import { AdaptiveSheet, Button, TabSwitcher } from '@/shared/components';
import { getErrorMessage } from '@/shared/utils/error';
import { useFabricCategories } from '@/application/settings';
import {
  useUploadFabricImage,
  useDeleteFabricImage,
} from '@/application/inventory/useFabricImage';
import {
  LabelRegistry,
  computeLayout,
  HtmlRenderer,
} from '@/shared/lib/label-engine';
import { FABRIC_CATALOG_STATUS_LABELS } from '@/schema/fabric-catalog.schema';

import { FabricAdminTab } from './components/FabricAdminTab';
import { FabricPublicTab } from './components/FabricPublicTab';
import { FabricInfoTab } from './components/FabricInfoTab';
import type { FabricCatalog } from './types';
import { LABELS } from './fabric-catalog.constants';
import { FabricImageGalleryEditor } from './components/FabricImageGalleryEditor';
import { useFabricCatalogForm } from './hooks/useFabricCatalogForm';

type FormTab = 'info' | 'public' | 'gallery' | 'admin';

const FORM_TABS: { key: FormTab; label: string }[] = [
  { key: 'info', label: LABELS.TAB_INFO },
  { key: 'public', label: LABELS.TAB_PUBLIC },
  { key: 'gallery', label: LABELS.TAB_GALLERY },
  { key: 'admin', label: LABELS.TAB_ADMIN },
];

type FabricCatalogFormProps = {
  catalog: FabricCatalog | null;
  onClose: () => void;
};

export function FabricCatalogForm({
  catalog,
  onClose,
}: FabricCatalogFormProps) {
  const uploadImageMutation = useUploadFabricImage();
  const deleteImageMutation = useDeleteFabricImage();
  const { data: categories } = useFabricCategories();

  const categoryOptions =
    categories?.map((c) => ({
      value: c.id,
      label: c.name,
    })) ?? [];

  const {
    methods,
    activeTab,
    setActiveTab,
    isEditing,
    isPending,
    mutationError,
    publicUrl,
    isSlugEditing,
    printAreaRef,
    handleDownloadQR,
    handlePrintQR,
    handleCopyLink,
    handleSlugEditStart,
    handleSlugEditCancel,
    onSubmit,
    labelData,
    autoSaveStatus,
    lastSavedTimeText,
  } = useFabricCatalogForm(catalog, onClose);

  const template = LabelRegistry.get('fabric-80x40');
  const layoutTree = useMemo(
    () => template.buildLayout(labelData),
    [template, labelData],
  );
  const absoluteNodes = useMemo(
    () => computeLayout(layoutTree, 0, 0, template.widthPx, template.heightPx),
    [layoutTree, template],
  );

  return (
    <AdaptiveSheet
      open={true}
      size="lg"
      onClose={onClose}
      title={
        <div className="flex flex-col gap-1.5 mt-1">
          <div>
            {isEditing
              ? `${LABELS.EDIT_TITLE}: ${catalog?.name}`
              : LABELS.ADD_NEW}
          </div>
          {isEditing && catalog && (
            <div className="flex items-center gap-2 text-xs font-normal text-muted-foreground mt-0.5">
              <span className="font-mono bg-surface-secondary px-1.5 py-0.5 rounded text-muted font-medium">
                {catalog.code}
              </span>
              {catalog.category_id && (
                <>
                  <span>•</span>
                  <span>
                    {categoryOptions.find(
                      (c) => c.value === catalog.category_id,
                    )?.label || 'Không phân nhóm'}
                  </span>
                </>
              )}
              <span>•</span>
              <span>{FABRIC_CATALOG_STATUS_LABELS[catalog.status]}</span>
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted-foreground ml-2">
            {autoSaveStatus === 'saving' && 'Đang lưu nháp...'}
            {autoSaveStatus === 'saved' &&
              lastSavedTimeText &&
              `Lưu nháp lần cuối: ${lastSavedTimeText}`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isPending}
            >
              {LABELS.CANCEL}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="fabric-catalog-form"
              isLoading={isPending}
            >
              {isEditing ? LABELS.UPDATE : LABELS.ADD_NEW}
            </Button>
          </div>
        </div>
      }
      subHeader={
        <div className="px-6 py-2 border-b border-default bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <TabSwitcher
            tabs={FORM_TABS}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>
      }
    >
      <FormProvider {...methods}>
        {mutationError && (
          <p className="error-inline mb-4">
            {LABELS.ERROR_PREFIX} {getErrorMessage(mutationError)}
          </p>
        )}

        <form
          id="fabric-catalog-form"
          onSubmit={onSubmit}
          noValidate
          className="space-y-6 pb-4"
        >
          {activeTab === 'info' && (
            <FabricInfoTab
              catalog={catalog}
              isEditing={isEditing}
              categoryOptions={categoryOptions}
              uploadImageMutation={uploadImageMutation}
              deleteImageMutation={deleteImageMutation}
            />
          )}

          {activeTab === 'public' && (
            <FabricPublicTab
              publicUrl={publicUrl}
              updatedAt={catalog?.updated_at}
            />
          )}

          {activeTab === 'gallery' && <FabricImageGalleryEditor />}

          {activeTab === 'admin' && (
            <FabricAdminTab
              publicUrl={publicUrl}
              isSlugEditing={isSlugEditing}
              handleSlugEditStart={handleSlugEditStart}
              handleSlugEditCancel={handleSlugEditCancel}
              handleCopyLink={handleCopyLink}
              handleDownloadQR={handleDownloadQR}
              handlePrintQR={handlePrintQR}
            />
          )}
        </form>
        <div style={{ display: 'none' }}>
          <div ref={printAreaRef}>
            <HtmlRenderer
              nodes={absoluteNodes}
              widthPx={template.widthPx}
              heightPx={template.heightPx}
            />
          </div>
        </div>
      </FormProvider>
    </AdaptiveSheet>
  );
}
