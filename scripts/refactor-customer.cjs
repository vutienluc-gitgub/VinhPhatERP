const fs = require('fs');

let f = 'src/features/fabric-catalog/components/public-tab-sections/FabricPublicCustomerSection.tsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
  "import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);

c = c.replace(/LABELS\.STOCK/g, "COMP_LABELS.STOCK");
c = c.replace(/LABELS\.TRUST/g, "COMP_LABELS.TRUST");

fs.writeFileSync(f, c, 'utf8');
