const fs = require('fs');
const path = require('path');

const modulePath = path.join('src', 'features', 'finished-fabric', 'finished-fabric.module.ts');
let moduleContent = fs.readFileSync(modulePath, 'utf8');

moduleContent = moduleContent.replace(
  "import { createModule } from '@/core/registry/moduleRegistry';",
  "import { createModule } from '@/core/registry/moduleRegistry';\nimport { FINISHED_FABRIC_MODULE_LABELS as MSG } from './finished-fabric.constants';"
);

moduleContent = moduleContent.replace("'Vải thành phẩm (Lưu kho)'", "MSG.FEATURE_TITLE");
moduleContent = moduleContent.replace("'Quản lý tồn kho vải đã nhuộm thành phẩm, sẵn sàng giao hàng hoặc xả kho.'", "MSG.FEATURE_DESC");
moduleContent = moduleContent.replace("'Kho Thành phẩm'", "MSG.PLUGIN_LABEL");
moduleContent = moduleContent.replace("'Thành phẩm'", "MSG.PLUGIN_SHORT_LABEL");
moduleContent = moduleContent.replace("'Theo dõi tồn kho vải đã nhuộm, nhập kho và xuất kho giao hàng.'", "MSG.PLUGIN_DESC");

fs.writeFileSync(modulePath, moduleContent, 'utf8');

const constantsPath = path.join('src', 'features', 'finished-fabric', 'finished-fabric.constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');

const newModuleLabels = `export const FINISHED_FABRIC_MODULE_LABELS = {
  FEATURE_TITLE: 'Vải thành phẩm (Lưu kho)',
  FEATURE_DESC: 'Quản lý tồn kho vải đã nhuộm thành phẩm, sẵn sàng giao hàng hoặc xả kho.',
  PLUGIN_LABEL: 'Kho Thành phẩm',
  PLUGIN_SHORT_LABEL: 'Thành phẩm',
  PLUGIN_DESC: 'Theo dõi tồn kho vải đã nhuộm, nhập kho và xuất kho giao hàng.',
} as const;`;

constantsContent = constantsContent.replace(
  "export const FINISHED_FABRIC_TRANSITIONS_LABELS",
  newModuleLabels + "\n\nexport const FINISHED_FABRIC_TRANSITIONS_LABELS"
);

fs.writeFileSync(constantsPath, constantsContent, 'utf8');

console.log('Module and constants updated');
