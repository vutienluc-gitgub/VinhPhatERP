const fs = require('fs');
const path = require('path');

const f1 = path.join('src', 'features', 'finished-fabric', 'FinishedFabricForm.tsx');
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "import { FINISHED_FABRIC_MESSAGES as MSG } from './finished-fabric.constants';",
  "import { FINISHED_FABRIC_FORM_LABELS as MSG } from './finished-fabric.constants';"
);

c1 = c1.replace(
  "submitLabel={isEditing ? 'Lưu thay đổi' : 'Nhập kho'}",
  "submitLabel={isEditing ? MSG.BTN_SAVE_EDIT : MSG.BTN_SAVE_NEW}"
);

fs.writeFileSync(f1, c1, 'utf8');
console.log('FinishedFabricForm updated');
