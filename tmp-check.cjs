const fs = require('fs');

const pathAudit =
  'C:/Users/Admin/.gemini/antigravity/brain/07b73fa1-e987-4953-aa2b-d91e4452f3ec/quotation-audit-report.md';
let audit = fs.readFileSync(pathAudit, 'utf8');

audit = audit.replace(/1\. \[ \] Tạo/g, '1. [x] Tạo');
audit = audit.replace(/2\. \[ \] Tạo/g, '2. [x] Tạo');
audit = audit.replace(/3\. \[ \] Cả/g, '3. [x] Cả');
audit = audit.replace(
  /4\. \[ \] Migration: thêm `source_quotation_id`/g,
  '4. [x] Migration: thêm `source_quotation_id`',
);
audit = audit.replace(
  /5\. \[ \] Migration: thêm `width_cm`/g,
  '5. [x] Migration: thêm `width_cm`',
);
audit = audit.replace(/6\. \[ \] OrderDetail/g, '6. [x] OrderDetail');
audit = audit.replace(
  /7\. \[ \] Copy `delivery_terms/g,
  '7. [x] Copy `delivery_terms',
);
audit = audit.replace(/8\. \[ \] Sau khi convert/g, '8. [x] Sau khi convert');
audit = audit.replace(/12\. \[ \] QuotationPrint/g, '12. [x] QuotationPrint');

fs.writeFileSync(pathAudit, audit);
console.log('Audit check done');

const pathPlan =
  'C:/Users/Admin/.gemini/antigravity/brain/07b73fa1-e987-4953-aa2b-d91e4452f3ec/quotation-feature-plan.md';
let plan = fs.readFileSync(pathPlan, 'utf8');

plan = plan.replace(
  /13\. ⏳ Tạo `QuotationPrint/g,
  '13. ✅ Tạo `QuotationPrint',
);
fs.writeFileSync(pathPlan, plan);
console.log('Plan check done');
