const fs = require('fs');

const file = 'src/features/fabric-catalog/components/detail/FabricSpecsList.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';",
  "import { PUBLIC_PAGE_LABELS as LABELS, PUBLIC_COMPONENT_LABELS as COMP_LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);

content = content.replace(
  'Trạng thái kho ({activeVariant.color_name})',
  "{COMP_LABELS.INVENTORY_STATUS_TITLE.replace('{color}', activeVariant.color_name)}"
);

content = content.replace(
  "? 'Sẵn có'",
  "? COMP_LABELS.IN_STOCK"
);

content = content.replace(
  ": 'Hết hàng'}",
  ": COMP_LABELS.OUT_OF_STOCK}"
);

fs.writeFileSync(file, content, 'utf8');
