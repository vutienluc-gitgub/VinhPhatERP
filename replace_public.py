import sys

with open('src/features/fabric-catalog/FabricCatalogForm.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if '{/* ── TAB: Cong khai ── */}' in line:
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

    if skip and 'activeTab === \'gallery\'' in line:
        skip = False

    if not skip:
        new_lines.append(line)

with open('src/features/fabric-catalog/FabricCatalogForm.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done replacing public tab')
