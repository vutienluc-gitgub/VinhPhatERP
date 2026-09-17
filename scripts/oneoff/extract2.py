import subprocess

result = subprocess.run(['git', 'show', 'HEAD:src/features/fabric-catalog/FabricCatalogForm.tsx'], capture_output=True, text=True, encoding='utf-8')
content_str = result.stdout
lines = content_str.splitlines(True)

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '{/* ── TAB: Cong khai ── */}' in line:
        start_idx = i + 1
    if "activeTab === 'gallery'" in line:
        end_idx = i - 1
        break

# The block is:          {activeTab === 'public' && ( ... )}
# We want to extract the `...`
# Which starts after `{activeTab === 'public' && (` and ends before `)}`
content = ''.join(lines[start_idx+1:end_idx-1])

new_file_content = f'''import React, {{ useRef }} from 'react';
import {{ useFormContext, Controller, useFieldArray }} from 'react-hook-form';
import {{ Button, Icon, Switch, Badge }} from '@/shared/components';
import {{ QRCodeDisplay }} from '@/shared/components/QRCodeDisplay';
import {{ LABELS }} from '../fabric-catalog.constants';
import type {{ FabricCatalogFormValues }} from '@/schema/fabric-catalog.schema';
import type {{ FabricCatalog }} from '../types';
import {{ FabricPublicPreview }} from './FabricPublicPreview';
import {{ getLowestPrice }} from '../fabric-catalog.utils';

type FabricPublicTabProps = {{
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
}};

export function FabricPublicTab({{
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
}}: FabricPublicTabProps) {{
  const {{
    register,
    control,
    watch,
    setValue,
    formState: {{ errors }},
  }} = useFormContext<FabricCatalogFormValues>();

  const {{
    fields: pricingTiers,
    append: appendTier,
    remove: removeTier,
  }} = useFieldArray({{
    control,
    name: 'pricing_tiers',
  }});

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
{content}
    </>
  );
}}
'''

with open('src/features/fabric-catalog/components/FabricPublicTab.tsx', 'w', encoding='utf-8') as f:
    f.write(new_file_content)

print('Extracted FabricPublicTab.tsx successfully from git')
