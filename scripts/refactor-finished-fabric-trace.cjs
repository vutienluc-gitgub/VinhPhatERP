const fs = require('fs');
const path = require('path');

const constantsPath = path.join('src', 'features', 'finished-fabric', 'finished-fabric.constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Update Trace labels in constants
const newTraceLabels = `export const FINISHED_FABRIC_TRACE_LABELS = {
  TITLE: '🔗 Truy vết nguồn gốc',
  BTN_CLOSE: 'Đóng',
  NODE_FINISHED: 'Cuộn thành phẩm',
  NODE_RAW: 'Cuộn vải mộc',
  NODE_YARN: 'Phiếu nhập sợi',
  LBL_LOT: '📦 Lô:',
  LBL_WEAVER: '🏠 Nhà dệt:',
  LBL_SUPPLIER: '🏢 NCC sợi:',
  LBL_STATUS: 'Trạng thái:',
  LBL_DATE: 'Ngày:',
  LBL_VALUE: 'Giá trị:',
  LBL_YARN_LINES: 'dòng sợi',
  LOADING: 'Đang tải...',
  EMPTY_RAW: 'Không có liên kết cuộn mộc',
  EMPTY_YARN: 'Không có liên kết phiếu nhập sợi',
  STATUS: {
    in_stock: 'Trong kho',
    sold: 'Đã bán',
    reserved: 'Đã giữ',
    defective: 'Lỗi',
    draft: 'Nháp',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã hủy',
  } as Record<string, string>,
} as const;`;

constantsContent = constantsContent.replace(
  /export const FINISHED_FABRIC_TRACE_LABELS = \{[\s\S]*?\} as const;/m,
  newTraceLabels
);

fs.writeFileSync(constantsPath, constantsContent, 'utf8');

// Update TraceChainPanel.tsx
const tracePath = path.join('src', 'features', 'finished-fabric', 'TraceChainPanel.tsx');
let traceContent = fs.readFileSync(tracePath, 'utf8');

traceContent = traceContent.replace(
  "import { formatQuantity, formatCurrency } from '@/shared/value/core/formatter';",
  "import { formatQuantity, formatCurrency } from '@/shared/value/core/formatter';\nimport { FINISHED_FABRIC_TRACE_LABELS as MSG } from './finished-fabric.constants';"
);

// Remove local STATUS_LABELS
traceContent = traceContent.replace(
  /const STATUS_LABELS: Record<string, string> = \{[\s\S]*?\};\n/m,
  ""
);
traceContent = traceContent.replace(/STATUS_LABELS/g, "MSG.STATUS");

traceContent = traceContent.replace("🔗 Truy vết nguồn gốc", "{MSG.TITLE}");
traceContent = traceContent.replace(">\n          Đóng\n        </button>", ">{MSG.BTN_CLOSE}</button>");
traceContent = traceContent.replace(/>Đóng<\/button>/, ">{MSG.BTN_CLOSE}</button>");
traceContent = traceContent.replace(/>Cuộn thành phẩm<\/p>/, ">{MSG.NODE_FINISHED}</p>");
traceContent = traceContent.replace(/>Đang tải...<\/p>/, ">{MSG.LOADING}</p>");
traceContent = traceContent.replace(/>Cuộn vải mộc<\/p>/g, ">{MSG.NODE_RAW}</p>");
traceContent = traceContent.replace(/📦 Lô: /g, "{MSG.LBL_LOT} ");
traceContent = traceContent.replace(/🏠 Nhà dệt: /g, "{MSG.LBL_WEAVER} ");
traceContent = traceContent.replace(/Trạng thái: /g, "{MSG.LBL_STATUS} ");
traceContent = traceContent.replace(/>Không có liên kết cuộn mộc<\/p>/, ">{MSG.EMPTY_RAW}</p>");
traceContent = traceContent.replace(/>Phiếu nhập sợi<\/p>/g, ">{MSG.NODE_YARN}</p>");
traceContent = traceContent.replace(/Ngày: /, "{MSG.LBL_DATE} ");
traceContent = traceContent.replace(/Giá trị: /, "{MSG.LBL_VALUE} ");
traceContent = traceContent.replace(/ dòng sợi/, " {MSG.LBL_YARN_LINES}");
traceContent = traceContent.replace(/🏢 NCC sợi: /, "{MSG.LBL_SUPPLIER} ");
traceContent = traceContent.replace(/>Không có liên kết phiếu nhập sợi<\/p>/, ">{MSG.EMPTY_YARN}</p>");

fs.writeFileSync(tracePath, traceContent, 'utf8');

// Update transitions.ts
const transitionsPath = path.join('src', 'features', 'finished-fabric', 'transitions.ts');
let transitionsContent = fs.readFileSync(transitionsPath, 'utf8');

transitionsContent = transitionsContent.replace(
  "import type { RollStatus } from './types';",
  "import type { RollStatus } from './types';\nimport { FINISHED_FABRIC_TRANSITIONS_LABELS as MSG } from './finished-fabric.constants';"
);

transitionsContent = transitionsContent.replace("'Cuộn đã xuất kho — không thể chỉnh sửa'", "MSG.ERR_SHIPPED_EDIT");
transitionsContent = transitionsContent.replace("'Cuộn đã xóa sổ — không thể chỉnh sửa'", "MSG.ERR_WRITTEN_OFF_EDIT");
transitionsContent = transitionsContent.replace("'Cuộn đã xuất kho — không thể xóa'", "MSG.ERR_SHIPPED_DEL");
transitionsContent = transitionsContent.replace("'Cuộn đang được đặt trước — không thể xóa'", "MSG.ERR_RESERVED_DEL");
transitionsContent = transitionsContent.replace("'Cuộn hư hỏng — không thể xóa, hãy giữ để kiểm tra'", "MSG.ERR_DAMAGED_DEL");
transitionsContent = transitionsContent.replace("'Cuộn đã xóa sổ — không thể xóa'", "MSG.ERR_WRITTEN_OFF_DEL");

fs.writeFileSync(transitionsPath, transitionsContent, 'utf8');

console.log('TraceChainPanel and transitions updated');
