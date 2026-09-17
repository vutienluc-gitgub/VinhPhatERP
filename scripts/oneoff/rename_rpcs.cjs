const fs = require('fs');
const path = require('path');

const fns = {
  atomic_create_bom: 'rpc_create_bom',
  atomic_update_bom: 'rpc_update_bom',
  atomic_approve_bom: 'rpc_approve_bom',
  atomic_deprecate_bom: 'rpc_deprecate_bom',
  atomic_revise_bom: 'rpc_revise_bom',
  sync_shipment_debt: 'rpc_sync_shipment_debt',
  pay_customer_debt: 'rpc_pay_customer_debt',
  atomic_update_shipment_journey: 'rpc_update_shipment_journey',
  atomic_create_dyeing_order: 'rpc_create_dyeing_order',
  atomic_update_dyeing_order: 'rpc_update_dyeing_order',
  complete_dyeing_order: 'rpc_complete_dyeing_order',
  atomic_link_profile_to_employee: 'rpc_link_profile_to_employee',
  generate_next_doc_number: 'rpc_generate_next_doc_number',
  atomic_create_order: 'rpc_create_order',
  update_order_with_items: 'rpc_update_order_with_items',
  confirm_order: 'rpc_confirm_order',
  atomic_cancel_order: 'rpc_cancel_order',
  atomic_create_payment: 'rpc_create_payment',
  get_debt_summary: 'rpc_get_debt_summary',
  atomic_create_expense: 'rpc_create_expense',
  get_cash_flow_summary: 'rpc_get_cash_flow_summary',
  get_expense_by_category: 'rpc_get_expense_by_category',
  atomic_create_quotation: 'rpc_create_quotation',
  atomic_update_quotation: 'rpc_update_quotation',
  atomic_create_shipment: 'rpc_create_shipment',
  atomic_confirm_shipment: 'rpc_confirm_shipment',
  atomic_delete_shipment: 'rpc_delete_shipment',
  pay_supplier_debt: 'rpc_pay_supplier_debt',
  update_supplier: 'rpc_update_supplier',
  next_weaving_invoice_number: 'rpc_next_weaving_invoice_number',
  atomic_create_weaving_invoice: 'rpc_create_weaving_invoice',
  atomic_update_weaving_invoice: 'rpc_update_weaving_invoice',
  confirm_weaving_invoice: 'rpc_confirm_weaving_invoice',
  atomic_create_work_order: 'rpc_create_work_order',
  atomic_start_work_order: 'rpc_start_work_order',
  atomic_complete_work_order: 'rpc_complete_work_order',
  atomic_create_yarn_receipt: 'rpc_create_yarn_receipt',
  atomic_update_yarn_receipt: 'rpc_update_yarn_receipt',
  check_slug_available: 'rpc_check_slug_available',
  create_tenant: 'rpc_create_tenant',
  atomic_convert_quotation_to_order: 'rpc_convert_quotation_to_order',
};

// 1. Generate SQL migration file
const sqlStatements = Object.entries(fns).map(
  ([oldName, newName]) =>
    `ALTER FUNCTION public.${oldName} RENAME TO ${newName};`,
);

const migrationSql =
  `-- Rename RPC functions to unify naming convention\n\n` +
  sqlStatements.join('\n');
const todayStr = new Date().toISOString().replace(/\D/g, '').substring(0, 14);
const migrationFilename = `${todayStr}_rename_rpc_functions.sql`;
const migrationPath = path.join(
  process.cwd(),
  'supabase',
  'migrations',
  migrationFilename,
);

fs.writeFileSync(migrationPath, migrationSql);
console.log(`Created migration file: ${migrationPath}`);

// 2. Replace the function calls in src codebase
function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build', '.temp'].includes(file)) {
        processDir(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      for (const [oldName, newName] of Object.entries(fns)) {
        // match .rpc('atomic_create_order'
        const regex = new RegExp(`\\.rpc\\(['"]${oldName}['"]`, 'g');
        const updated = content.replace(regex, `.rpc('${newName}'`);
        if (updated !== content) {
          content = updated;
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated RPC calls in: ${fullPath}`);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
console.log('Finished renaming RPCs.');
