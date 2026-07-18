const fs = require('fs');

// 1. FabricPublicCustomerSection.tsx
let f1 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicCustomerSection.tsx';
let c1 = fs.readFileSync(f1, 'utf8');

// Replace COMP_LABELS with TAB_LABELS
c1 = c1.replace(/COMP_LABELS\.STOCK/g, 'TAB_LABELS.STOCK');
c1 = c1.replace(/COMP_LABELS\.TRUST/g, 'TAB_LABELS.TRUST');

// Fix the import line
c1 = c1.replace(
  "import { LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
fs.writeFileSync(f1, c1, 'utf8');

// 2. FabricPublicStatusSection.tsx
let f2 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx';
let c2 = fs.readFileSync(f2, 'utf8');

// Remove COMP_LABELS from import
c2 = c2.replace(
  ", PUBLIC_COMPONENT_LABELS as COMP_LABELS",
  ""
);
fs.writeFileSync(f2, c2, 'utf8');
