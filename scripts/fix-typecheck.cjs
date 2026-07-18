const fs = require('fs');

// 1. Fix FabricPublicPreview.tsx
let f1 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicPreview.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(
  "import { PUBLIC_TAB_LABELS as LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
c1 = c1.replace(
  /LABELS\.STOCK_QTY_AVAILABLE/g,
  "TAB_LABELS.STOCK_QTY_AVAILABLE"
);
fs.writeFileSync(f1, c1, 'utf8');

// 2. Fix FabricPublicPricingSection.tsx
let f2 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicPricingSection.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(
  "import { PUBLIC_TAB_LABELS as LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
c2 = c2.replace(/LABELS\.PRIORITY/g, 'TAB_LABELS.PRIORITY');
c2 = c2.replace(/LABELS\.TARGET_GROUPS/g, 'TAB_LABELS.TARGET_GROUPS');
c2 = c2.replace(/LABELS\.ALL_GENERAL/g, 'TAB_LABELS.ALL_GENERAL');
c2 = c2.replace(/LABELS\.CHOOSE_CUST_GROUP/g, 'TAB_LABELS.CHOOSE_CUST_GROUP');
c2 = c2.replace(/LABELS\.CLEAR_ALL/g, 'TAB_LABELS.CLEAR_ALL');
fs.writeFileSync(f2, c2, 'utf8');

// 3. Fix FabricPublicCustomerSection.tsx
let f3 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicCustomerSection.tsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(
  "import { PUBLIC_TAB_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
c3 = c3.replace(/LABELS\.CUSTOMER_EXP/g, 'TAB_LABELS.CUSTOMER_EXP');
fs.writeFileSync(f3, c3, 'utf8');

// 4. Fix FabricPublicStatusSection.tsx
let f4 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx';
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace(
  "import { PUBLIC_TAB_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_TAB_LABELS as TAB_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);
c4 = c4.replace(/LABELS\.LAST_UPDATED/g, 'TAB_LABELS.LAST_UPDATED');
fs.writeFileSync(f4, c4, 'utf8');

// 5. Fix B2BPlanner.tsx
let f5 = 'src/features/fabric-catalog/components/B2BPlanner.tsx';
let c5 = fs.readFileSync(f5, 'utf8');
c5 = c5.replace(/moq\.toLocaleString\(\)/g, 'moq.toString()');
c5 = c5.replace(/lengthMeters\.toLocaleString\([^)]+\)/g, 'lengthMeters.toFixed(1).toString()');
fs.writeFileSync(f5, c5, 'utf8');
