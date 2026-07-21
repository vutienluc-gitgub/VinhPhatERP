const fs = require('fs');
const path = require('path');

const listPath = path.join('src', 'features', 'finished-fabric', 'FinishedFabricList.tsx');
let listContent = fs.readFileSync(listPath, 'utf8');

listContent = listContent.replace(
  "import { FINISHED_FABRIC_MESSAGES as MSG } from './finished-fabric.constants';",
  "import { FINISHED_FABRIC_PAGE_LABELS as MSG, FINISHED_FABRIC_LIST_LABELS as LIST_MSG } from './finished-fabric.constants';"
);

// We need to replace all MSG.<label> with LIST_MSG.<label> if it belongs to LIST_MSG
const listKeys = [
  'FILTER_FABRIC_LABEL', 'FILTER_FABRIC_PLACEHOLDER', 'FILTER_STATUS_LABEL',
  'FILTER_QUALITY_LABEL', 'EMPTY_STATE_FILTER_TITLE', 'EMPTY_STATE_DEFAULT_TITLE',
  'EMPTY_STATE_DEFAULT_DESC', 'BTN_NEW', 'BTN_BULK_NEW', 'BTN_EXPORT',
  'ERR_LOAD', 'ERR_EXPORT', 'CONFIRM_DELETE_MSG', 'LBL_NO_LOT'
];

listKeys.forEach(key => {
  listContent = listContent.split(`MSG.${key}`).join(`LIST_MSG.${key}`);
});

fs.writeFileSync(listPath, listContent, 'utf8');

const columnsPath = path.join('src', 'features', 'finished-fabric', 'FinishedFabricColumns.tsx');
let columnsContent = fs.readFileSync(columnsPath, 'utf8');

columnsContent = columnsContent.replace(
  "import { ROLL_STATUS_LABELS } from '@/schema/finished-fabric.schema';",
  "import { ROLL_STATUS_LABELS } from '@/schema/finished-fabric.schema';\nimport { FINISHED_FABRIC_LIST_LABELS as LIST_MSG } from './finished-fabric.constants';"
);

// We need to replace the column headers
columnsContent = columnsContent.replace("header: 'Mã cuộn'", "header: LIST_MSG.COL_ROLL_NUMBER");
columnsContent = columnsContent.replace("header: 'Loại vải'", "header: LIST_MSG.COL_FABRIC_TYPE");
columnsContent = columnsContent.replace("header: 'CL'", "header: 'CL'"); // Wait, do I have a label for CL? Let me check constants... no. But I can leave it or add it later.
columnsContent = columnsContent.replace("header: 'Khổ × Dài'", "header: 'Khổ × Dài'");
columnsContent = columnsContent.replace("header: 'Trọng lượng'", "header: LIST_MSG.COL_WEIGHT");
columnsContent = columnsContent.replace("header: 'Trạng thái'", "header: LIST_MSG.COL_STATUS");
columnsContent = columnsContent.replace("header: 'Vị trí'", "header: 'Vị trí'");
columnsContent = columnsContent.replace("header: () => <div className=\"text-right\">Thao tác</div>", "header: () => <div className=\"text-right\">{LIST_MSG.COL_ACTIONS}</div>");
columnsContent = columnsContent.replace("title: 'Truy vết'", "title: LIST_MSG.BTN_TRACE_TITLE");
columnsContent = columnsContent.replace("title: editBlockReason(r.status) ?? 'Sửa'", "title: editBlockReason(r.status) ?? LIST_MSG.BTN_EDIT_TITLE");
columnsContent = columnsContent.replace("title: deleteBlockReason(r.status) ?? 'Xóa'", "title: deleteBlockReason(r.status) ?? LIST_MSG.BTN_DELETE_TITLE");

// Mobile view
columnsContent = columnsContent.replace("Trọng lượng", "Trọng lượng");
columnsContent = columnsContent.replace("Chất lượng", "Chất lượng");
columnsContent = columnsContent.replace("Truy vết", "{LIST_MSG.BTN_TRACE_TITLE}");
columnsContent = columnsContent.replace("Sửa", "{LIST_MSG.BTN_EDIT_TITLE}");

fs.writeFileSync(columnsPath, columnsContent, 'utf8');

console.log('FinishedFabricList and Columns updated');
