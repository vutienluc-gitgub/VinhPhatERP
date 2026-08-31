import * as fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/audit_output.json', 'utf-8'));

interface Policy {
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

interface Column {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

const policies = raw.policies as Policy[];
const columns = raw.columns as Column[];

const coreTables = [
  'orders',
  'order_items',
  'shipments',
  'shipment_items',
  'quotations',
  'quotation_items',
  'payments',
  'contracts',
  'order_requests',
];

let report = `# BAO CAO KIEM TOAN BAO MAT & MA TRAN UY QUYEN TOAN HE THONG (VinhPhatERP)\n\n`;

report += `## 1. Kiem Toan Hien Trang RLS Tren Cac Bang Nghiep Vu Trong Yeu\n\n`;

for (const t of coreTables) {
  const tablePols = policies.filter((p) => p.tablename === t);
  const tableCols = columns.filter((c) => c.table_name === t);

  report += `### Bang: \`${t}\`\n`;
  report += `- **Cot lien ket doi tuong:** ${tableCols.map((c) => `\`${c.column_name}\``).join(', ')}\n`;
  report += `- **So luong Policy:** ${tablePols.length}\n`;

  if (tablePols.length === 0) {
    report += `> **CANH BAO:** Bang \`${t}\` CHUA CO RLS Policy hoac RLS bi bypass hoan toan!\n\n`;
  } else {
    report += `| Lenh (CMD) | Ten Policy | Roles | Permissive | Dieu Kien (USING / WITH CHECK) |\n`;
    report += `|:---:|---|---|:---:|---|\n`;
    for (const p of tablePols) {
      const cond = p.qual
        ? `USING: \`${p.qual}\``
        : `WITH CHECK: \`${p.with_check}\``;
      report += `| **${p.cmd}** | ${p.policyname} | ${(p.roles || []).join(', ')} | ${p.permissive} | ${cond} |\n`;
    }
    report += `\n`;
  }
}

fs.writeFileSync('scripts/security_audit_report.md', report);
console.log('Report generated at scripts/security_audit_report.md');
