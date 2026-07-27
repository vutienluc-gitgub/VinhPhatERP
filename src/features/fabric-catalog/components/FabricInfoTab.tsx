import { UseMutationResult } from '@tanstack/react-query';

import type { FabricCatalog } from '@/features/fabric-catalog/types';

import {
  ImageSection,
  BasicInfoSection,
  SpecificationSection,
  AttributeSection,
  UnitSection,
} from './info-tab';

type FabricInfoTabProps = {
  catalog: FabricCatalog | null;
  isEditing: boolean;
  categoryOptions: { value: string; label: string }[];
  uploadImageMutation: UseMutationResult<string, Error, File>;
  deleteImageMutation: UseMutationResult<void, Error, string>;
};

export function FabricInfoTab({
  catalog,
  isEditing,
  categoryOptions,
  uploadImageMutation,
  deleteImageMutation,
}: FabricInfoTabProps) {
  return (
    <>
      <ImageSection
        uploadImageMutation={uploadImageMutation}
        deleteImageMutation={deleteImageMutation}
      />
      <div className="bg-white rounded-2xl border border-default shadow-sm p-6 sm:p-8 space-y-12">
        <BasicInfoSection
          catalog={catalog}
          categoryOptions={categoryOptions}
          isEditing={isEditing}
        />
        <div className="h-px bg-surface-secondary w-full" />
        <SpecificationSection />
        <div className="h-px bg-surface-secondary w-full" />
        <AttributeSection catalog={catalog} />
        <div className="h-px bg-surface-secondary w-full" />
        <UnitSection />
      </div>
    </>
  );
}
