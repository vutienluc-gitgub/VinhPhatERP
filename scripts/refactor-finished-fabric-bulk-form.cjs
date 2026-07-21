const fs = require('fs');
const path = require('path');

const f1 = path.join('src', 'features', 'finished-fabric', 'FinishedFabricBulkForm.tsx');
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  "import { FINISHED_FABRIC_MESSAGES as MSG } from './finished-fabric.constants';",
  "import { FINISHED_FABRIC_BULK_LABELS as MSG, FINISHED_FABRIC_FORM_LABELS as FORM_MSG } from './finished-fabric.constants';"
);

c1 = c1.replace(
  "{ value: '', label: 'Chưa kiểm định' }",
  "{ value: '', label: FORM_MSG.LBL_UNVERIFIED }"
);

c1 = c1.replace(
  "title=\"Nhập nhanh cuộn vải thành phẩm\"",
  "title={MSG.FORM_TITLE}"
);

c1 = c1.replace(
  "<p className=\"bulk-success-title\">Nhập kho thành công</p>",
  "<p className=\"bulk-success-title\">{MSG.SUCCESS_TITLE}</p>"
);

c1 = c1.replace(
  "Đã lưu <strong>{savedRolls.length} cuộn</strong> ·{' '}",
  "Đã lưu <strong>{savedRolls.length} cuộn</strong> ·{' '}"
); // This one is tricky, let's just replace the raw text. Wait, MSG.SUCCESS_DESC has `{count}` and `{weight}`. I can just do: `{MSG.SUCCESS_DESC.replace('{count}', savedRolls.length.toString()).replace('{weight}', formatQuantity(sumBy(savedRolls, (r) => r.weight_kg ?? 0), 2))}`

c1 = c1.replace(
  /Đã lưu <strong>\{savedRolls\.length\} cuộn<\/strong> ·\{' '\}\s*<strong>\s*\{formatQuantity\(\s*sumBy\(savedRolls, \(r\) => r\.weight_kg \?\? 0\),\s*2,\s*\)\}\s*kg\s*<\/strong>/m,
  "{MSG.SUCCESS_DESC.replace('{count}', savedRolls.length.toString()).replace('{weight}', formatQuantity(sumBy(savedRolls, (r) => r.weight_kg ?? 0), 2))}"
);

c1 = c1.replace(
  "Tùy chọn: xuất danh sách vừa nhập ra file",
  "{MSG.SUCCESS_HINT}"
);

c1 = c1.replace(
  "<Icon name=\"FileSpreadsheet\" size={16} /> Xuất Excel",
  "<Icon name=\"FileSpreadsheet\" size={16} /> {MSG.BTN_EXPORT_EXCEL}"
);

c1 = c1.replace(
  "<Icon name=\"Printer\" size={16} /> Xuất PDF",
  "<Icon name=\"Printer\" size={16} /> {MSG.BTN_EXPORT_PDF}"
);

c1 = c1.replace(
  ">Đóng<",
  ">{MSG.BTN_CLOSE}<"
);
// ">\n              Đóng\n            </button>"
c1 = c1.replace(
  /\s*Đóng\s*<\/button>/,
  "{MSG.BTN_CLOSE}</button>"
);

c1 = c1.replace(
  "Lỗi:{' '}",
  "{MSG.ERR_PREFIX}{' '}"
);

c1 = c1.replace(
  "<legend>Import từ Excel / CSV</legend>",
  "<legend>{MSG.IMPORT_SECTION_TITLE}</legend>"
);

c1 = c1.replace(
  "Header: Mã cuộn, Cuộn mộc, Cân, Dài, CL, Ghi chú.",
  "{MSG.IMPORT_HINT}"
);

c1 = c1.replace(
  "Chưa tìm thấy cuộn mộc nào trong lô \"{lotNumber}\" —\n                          hãy kiểm tra lại số lô.",
  "{MSG.ERR_IMPORT_RAW_NOT_FOUND.replace('{lot}', lotNumber || '')}"
);

c1 = c1.replace(
  "File không có dữ liệu hoặc không đúng định dạng.",
  "MSG.ERR_IMPORT_EMPTY"
);

c1 = c1.replace(
  "`${parsed.length} dòng đã nhập. ${unresolved.length} cuộn mộc không tìm thấy trong lô \"${lotNumber}\": ${unresolved\n            .map((r) => r.raw_roll_number)\n            .join(', ')}. Vui lòng chọn lại cuộn mộc cho các dòng này.`",
  "MSG.ERR_IMPORT_RAW_MISSING.replace('{parsedCount}', parsed.length.toString()).replace('{unresolvedCount}', unresolved.length.toString()).replace('{lot}', lotNumber || '').replace('{missing}', unresolved.map((r) => r.raw_roll_number).join(', '))"
);

c1 = c1.replace(
  "`Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}`",
  "MSG.ERR_IMPORT_READ.replace('{msg}', err instanceof Error ? err.message : String(err))"
);

c1 = c1.replace(
  "<legend>Nhập số tịnh từng cuộn thành phẩm</legend>",
  "<legend>{MSG.MANUAL_SECTION_TITLE}</legend>"
);

c1 = c1.replace(
  /Đã ghép <strong>\{rawRollsForLot\.length\} cuộn mộc<\/strong> từ\s*lô\. Nhãn nhỏ trong ô = Mã cuộn mộc nguồn\./m,
  "{MSG.LOT_MATCH_INFO.replace('{matchedCount}', rawRollsForLot.length.toString())}"
);

c1 = c1.replace(
  "title={`Lô ${lotNumber ?? '—'} · ${fields.length} cuộn TP`}",
  "title={MSG.LOT_MATRIX_TITLE.replace('{lot}', lotNumber ?? '—').replace('{count}', fields.length.toString())}"
);

c1 = c1.replace(
  "+ 1 cuộn",
  "{MSG.BTN_ADD_ROW}"
);

c1 = c1.replace(
  "Gõ số tịnh → nhấn Enter để chuyển ô tiếp theo",
  "{MSG.ADD_ROW_HINT}"
);

c1 = c1.replace(
  "submitLabel={`Lưu ${totalRolls} cuộn`}",
  "submitLabel={MSG.BTN_SUBMIT.replace('{count}', totalRolls.toString())}"
);

fs.writeFileSync(f1, c1, 'utf8');
console.log('FinishedFabricBulkForm updated');
