const fs = require('fs');

// 1. FabricHeroGallery.tsx
let f1 = 'src/features/fabric-catalog/components/detail/FabricHeroGallery.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace("{LABELS.PREVIEW_NO_IMAGE}", "{COMP_LABELS.PREVIEW_NO_IMAGE}");
fs.writeFileSync(f1, c1, 'utf8');

// 2. FabricPublicCustomerSection.tsx
let f2 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicCustomerSection.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/TAB_LABELS\.STOCK/g, 'COMP_LABELS.STOCK');
c2 = c2.replace(/TAB_LABELS\.TRUST/g, 'COMP_LABELS.TRUST');
c2 = c2.replace(
  "import { PUBLIC_TAB_LABELS as TAB_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
fs.writeFileSync(f2, c2, 'utf8');

// 3. FabricPublicStatusSection.tsx
let f3 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(
  "import { LABELS, PUBLIC_TAB_LABELS as TAB_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
c3 = c3.replace(/LABELS\.PUBLIC_TITLE/g, 'COMP_LABELS.PUBLIC_TITLE');
c3 = c3.replace(/LABELS\.PUBLIC_DESC/g, 'COMP_LABELS.PUBLIC_DESC');
c3 = c3.replace(/LABELS\.VIEW_PUBLIC_PAGE/g, 'COMP_LABELS.VIEW_PUBLIC_PAGE');
fs.writeFileSync(f3, c3, 'utf8');
