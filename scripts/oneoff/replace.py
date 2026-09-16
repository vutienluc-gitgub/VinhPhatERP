import re

with open('src/features/fabric-catalog/FabricCatalogForm.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
imports = """import { FabricImageGalleryEditor } from './components/FabricImageGalleryEditor';
import { FabricInfoTab } from './components/FabricInfoTab';
import { FabricPublicTab } from './components/FabricPublicTab';
import { FabricAdminTab } from './components/FabricAdminTab';"""
content = re.sub(r"import \{ FabricImageGalleryEditor \} from '\./components/FabricImageGalleryEditor';", imports, content)

# 2. Remove getLowestPrice
content = re.sub(r"function getLowestPrice\([\s\S]*?return min;\n\}\n", "", content)

# 3. Remove useFieldArray import and usage
content = re.sub(r"import \{ useForm, Controller, useFieldArray \} from 'react-hook-form';", "import { useForm, Controller } from 'react-hook-form';", content)

content = re.sub(r"  const \{\n    fields: pricingTiers,\n    append: appendTier,\n    remove: removeTier,\n  \} = useFieldArray\(\{\n    control,\n    name: 'pricing_tiers',\n  \}\);\n", "", content)

# Remove lowestPrice usage
content = re.sub(r"  const lowestPrice = getLowestPrice\(pricingTiers\);\n", "", content)

# 4. Replace Info Tab
info_replacement = """          {activeTab === 'info' && (
            <FabricInfoTab 
              catalog={catalog}
              isEditing={isEditing}
              categoryOptions={categoryOptions}
              uploadImageMutation={uploadImageMutation}
              deleteImageMutation={deleteImageMutation}
            />
          )}"""
content = re.sub(r"          \{activeTab === 'info' && \(\n            <>\n(?:.*?\n)+?            </>\n          \)}", info_replacement, content)

# 5. Replace Public Tab
public_replacement = """          {activeTab === 'public' && (
            <FabricPublicTab 
              catalog={catalog}
              isEditing={isEditing}
              publicUrl={publicUrl}
              isSlugEditing={isSlugEditing}
              handleSlugEditStart={() => setIsSlugEditing(true)}
              handleSlugEditCancel={() => {
                setIsSlugEditing(false);
                setValue('slug', catalog?.slug ?? '');
              }}
              handleCopyLink={handleCopyLink}
              handleDownloadQR={handleDownloadQR}
              handlePrintQR={handlePrintQR}
              isCustomSlug={isCustomSlug}
              selectedCategoryName={selectedCategory?.name}
            />
          )}"""
content = re.sub(r"          \{activeTab === 'public' && \(\n            <div className=\"flex-1 min-w-0 flex flex-col\">(?:.*?\n)+?            </div>\n          \)}", public_replacement, content)

# 6. Replace Admin Tab
admin_replacement = """          {activeTab === 'admin' && <FabricAdminTab />}"""
content = re.sub(r"          \{activeTab === 'admin' && \(\n            <div className=\"space-y-4\">(?:.*?\n)+?            </div>\n          \)}", admin_replacement, content)

with open('src/features/fabric-catalog/FabricCatalogForm.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced content in FabricCatalogForm.tsx')
