const fs = require('fs');
let lines = fs.readFileSync('src/features/fabric-catalog/FabricCatalogForm.tsx', 'utf-8').split('\n');

const infoStart = lines.findIndex(l => l.includes("{activeTab === 'info' && ("));
const publicStart = lines.findIndex(l => l.includes("{activeTab === 'public' && ("));
const galleryStart = lines.findIndex(l => l.includes("{activeTab === 'gallery' && <FabricImageGalleryEditor />}"));
const adminStart = lines.findIndex(l => l.includes("{activeTab === 'admin' && ("));

let adminEnd = -1;
for (let i = adminStart + 1; i < lines.length; i++) {
  if (lines[i].includes(')}')) {
    adminEnd = i;
    break;
  }
}

// Ensure the imports are present
let importsCode = `
import { FabricInfoTab } from './components/FabricInfoTab';
import { FabricPublicTab } from './components/FabricPublicTab';
import { FabricAdminTab } from './components/FabricAdminTab';
`;

const head = lines.slice(0, infoStart);
const tail = lines.slice(adminEnd + 1);

const bodyCode = `          {activeTab === 'info' && (
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
              catalog={catalog}
              isEditing={isEditing}
              publicUrl={publicUrl}
              isSlugEditing={isSlugEditing}
              handleSlugEditStart={handleSlugEditStart}
              handleSlugEditCancel={handleSlugEditCancel}
              handleCopyLink={handleCopyLink}
              handleDownloadQR={handleDownloadQR}
              handlePrintQR={handlePrintQR}
              isCustomSlug={isCustomSlug}
              selectedCategoryName={selectedCategory?.name}
            />
          )}

          {activeTab === 'gallery' && <FabricImageGalleryEditor />}

          {activeTab === 'admin' && (
            <FabricAdminTab
              catalog={catalog}
              isEditing={isEditing}
            />
          )}`;

let newContent = head.join('\n') + '\n' + bodyCode + '\n' + tail.join('\n');
newContent = importsCode + newContent;
fs.writeFileSync('src/features/fabric-catalog/FabricCatalogForm.tsx', newContent);
console.log('Replaced tabs');
