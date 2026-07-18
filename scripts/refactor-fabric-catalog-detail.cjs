const fs = require('fs');

let f1 = 'src/features/fabric-catalog/fabric-catalog.constants.ts';
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "UNIT: 'Đơn vị',",
  "UNIT: 'Đơn vị',\n  TARGET_WIDTH: 'Khổ chuẩn:',\n  TARGET_GSM: 'K/L chuẩn:',"
);

fs.writeFileSync(f1, c1, 'utf8');

let f2 = 'src/features/fabric-catalog/FabricCatalogDetail.tsx';
let c2 = fs.readFileSync(f2, 'utf8');

c2 = c2.replace(
  "import { FABRIC_CATALOG_STATUS_LABELS } from '@/schema/fabric-catalog.schema';",
  "import { FABRIC_CATALOG_STATUS_LABELS } from '@/schema/fabric-catalog.schema';\nimport { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';"
);

c2 = c2.replace(
  "<span className=\"text-muted\">Khổ chuẩn: </span>",
  "<span className=\"text-muted\">{LABELS.TARGET_WIDTH} </span>"
);

c2 = c2.replace(
  "<span className=\"text-muted\">K/L chuẩn: </span>",
  "<span className=\"text-muted\">{LABELS.TARGET_GSM} </span>"
);

c2 = c2.replace(
  "<span className=\"text-muted\">Đơn vị: </span>",
  "<span className=\"text-muted\">{LABELS.UNIT}: </span>"
);

fs.writeFileSync(f2, c2, 'utf8');
