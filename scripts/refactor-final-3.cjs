const fs = require('fs');

// 1. FabricPublicCustomerSection.tsx
let f1 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicCustomerSection.tsx';
let c1 = fs.readFileSync(f1, 'utf8');

if (!c1.includes('TAB_LABELS.CUSTOMER_EXP')) {
  c1 = c1.replace(
    "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
    "import { LABELS, PUBLIC_TAB_LABELS as TAB_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
  );
  c1 = c1.replace(
    "Trải nghiệm khách hàng",
    "{TAB_LABELS.CUSTOMER_EXP}"
  );
  fs.writeFileSync(f1, c1, 'utf8');
}

// 2. FabricPublicStatusSection.tsx
let f2 = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicStatusSection.tsx';
let c2 = fs.readFileSync(f2, 'utf8');

if (!c2.includes('TAB_LABELS.LAST_UPDATED')) {
  c2 = c2.replace(
    "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
    "import { LABELS, PUBLIC_TAB_LABELS as TAB_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
  );
  c2 = c2.replace(
    "Cập nhật lần cuối",
    "{TAB_LABELS.LAST_UPDATED}"
  );
  fs.writeFileSync(f2, c2, 'utf8');
}
