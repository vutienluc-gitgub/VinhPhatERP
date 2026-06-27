const fs = require('fs');
const { execSync } = require('child_process');

const stdout = execSync('git show HEAD:src/features/fabric-catalog/FabricCatalogForm.tsx', { encoding: 'utf-8' });
const lines = stdout.split('\n');

let start_idx = -1;
let end_idx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* ── TAB: Cong khai ── */}')) {
    start_idx = i + 1;
  }
  if (lines[i].includes("activeTab === 'gallery'")) {
    end_idx = i - 1;
    break;
  }
}

const content = lines.slice(start_idx + 1, end_idx - 1).join('\n');

const newContent = `import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button, Icon, Switch, Badge } from '@/shared/components';
import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import { LABELS } from '../fabric-catalog.constants';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import type { FabricCatalog } from '../types';
import { FabricPublicPreview } from './FabricPublicPreview';
import { getLowestPrice } from '../fabric-catalog.utils';

type FabricPublicTabProps = {
  catalog: FabricCatalog | null;
  isEditing: boolean;
  publicUrl: string;
  isSlugEditing: boolean;
  handleSlugEditStart: () => void;
  handleSlugEditCancel: () => void;
  handleCopyLink: () => void;
  handleDownloadQR: () => void;
  handlePrintQR: () => void;
  isCustomSlug: React.MutableRefObject<boolean>;
  selectedCategoryName?: string;
};

export function FabricPublicTab({
  catalog,
  isEditing,
  publicUrl,
  isSlugEditing,
  handleSlugEditStart,
  handleSlugEditCancel,
  handleCopyLink,
  handleDownloadQR,
  handlePrintQR,
  isCustomSlug,
  selectedCategoryName,
}: FabricPublicTabProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FabricCatalogFormValues>();

  const {
    fields: pricingTiers,
    append: appendTier,
    remove: removeTier,
  } = useFieldArray({
    control,
    name: 'pricing_tiers',
  });

  const watchIsPublic = watch('is_public');
  const watchSlug = watch('slug');
  const watchCode = watch('code');
  const watchName = watch('name');
  const watchComposition = watch('composition_tags');
  const watchWidthCm = watch('target_width_cm');
  const watchGsm = watch('target_gsm');
  const watchTechnique = watch('technique');
  
  const currentImageUrl = watch('image_url');
  const lowestPrice = getLowestPrice(pricingTiers);

  return (
    <>
\n${content}\n
    </>
  );
}
`;

fs.writeFileSync('src/features/fabric-catalog/components/FabricPublicTab.tsx', newContent, 'utf-8');
console.log('Extracted properly using Node');
