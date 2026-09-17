import sys

with open('src/features/fabric-catalog/FabricCatalogForm.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "import { FabricImageGalleryEditor }" in line:
        new_lines.append("import { FabricInfoTab } from './components/FabricInfoTab';\n")
        new_lines.append("import { FabricPublicTab } from './components/FabricPublicTab';\n")
        new_lines.append("import { FabricAdminTab } from './components/FabricAdminTab';\n")
        new_lines.append(line)
        continue

    # Remove getLowestPrice import and useFieldArray usage
    if "getLowestPrice" in line:
        continue
    if "const lowestPrice = getLowestPrice(pricingTiers);" in line:
        continue
    if "const {" in line and "fields: pricingTiers," in lines[i+1]:
        skip = True
        continue
    if skip and "});" in line and "name: 'pricing_tiers'," in lines[i-1]:
        skip = False
        continue
    if skip:
        continue

    if "{/* ── TAB: Thong tin ── */}" in line:
        skip = True
        new_lines.append(line)
        new_lines.append("          {activeTab === 'info' && (\n")
        new_lines.append("            <FabricInfoTab \n")
        new_lines.append("              catalog={catalog}\n")
        new_lines.append("              isEditing={isEditing}\n")
        new_lines.append("              categoryOptions={categoryOptions}\n")
        new_lines.append("              uploadImageMutation={uploadImageMutation}\n")
        new_lines.append("              deleteImageMutation={deleteImageMutation}\n")
        new_lines.append("            />\n")
        new_lines.append("          )}\n\n")
        continue

    if "{/* ── TAB: Cong khai ── */}" in line:
        skip = True
        new_lines.append(line)
        new_lines.append("          {activeTab === 'public' && (\n")
        new_lines.append("            <FabricPublicTab \n")
        new_lines.append("              catalog={catalog}\n")
        new_lines.append("              isEditing={isEditing}\n")
        new_lines.append("              publicUrl={publicUrl}\n")
        new_lines.append("              isSlugEditing={isSlugEditing}\n")
        new_lines.append("              handleSlugEditStart={() => setIsSlugEditing(true)}\n")
        new_lines.append("              handleSlugEditCancel={() => {\n")
        new_lines.append("                setIsSlugEditing(false);\n")
        new_lines.append("                setValue('slug', catalog?.slug ?? '');\n")
        new_lines.append("              }}\n")
        new_lines.append("              handleCopyLink={handleCopyLink}\n")
        new_lines.append("              handleDownloadQR={handleDownloadQR}\n")
        new_lines.append("              handlePrintQR={handlePrintQR}\n")
        new_lines.append("              isCustomSlug={isCustomSlug}\n")
        new_lines.append("              selectedCategoryName={selectedCategory?.name}\n")
        new_lines.append("            />\n")
        new_lines.append("          )}\n\n")
        continue

    if "activeTab === 'gallery'" in line and skip:
        skip = False
        new_lines.append(line)
        continue

    if "{/* ── TAB: Admin ── */}" in line:
        skip = True
        new_lines.append(line)
        new_lines.append("          {activeTab === 'admin' && <FabricAdminTab />}\n")
        continue

    if "</form>" in line and skip:
        skip = False
        new_lines.append(line)
        continue

    if not skip:
        new_lines.append(line)

with open('src/features/fabric-catalog/FabricCatalogForm.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Updated FabricCatalogForm.tsx')
