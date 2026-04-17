const fs = require('fs');
const path = require('path');

const renameMap = {
  'customer.schema.ts': 'customers.schema.ts',
  'order.schema.ts': 'orders.schema.ts',
  'product.schema.ts': 'products.schema.ts',
  'shipping-rate.schema.ts': 'shipping-rates.schema.ts',
  'bom.schema.ts': 'boms.schema.ts',
  'fabric-catalog.schema.ts': 'fabric-catalogs.schema.ts',
  'payment.schema.ts': 'payments.schema.ts',
  'payment.schema.test.ts': 'payments.schema.test.ts',
  'debt.schema.ts': 'debts.schema.ts',
  'dyeing-order.schema.ts': 'dyeing-orders.schema.ts',
  'employee.schema.ts': 'employees.schema.ts',
  'color.schema.ts': 'colors.schema.ts',
  'quotation.schema.ts': 'quotations.schema.ts',
  'report.schema.ts': 'reports.schema.ts',
  'supplier.schema.ts': 'suppliers.schema.ts',
  'work-order.schema.ts': 'work-orders.schema.ts',
  'yarn-catalog.schema.ts': 'yarn-catalogs.schema.ts',
  'yarn-receipt.schema.ts': 'yarn-receipts.schema.ts',
  'raw-fabric.schema.ts': 'raw-fabrics.schema.ts',
  'finished-fabric.schema.ts': 'finished-fabrics.schema.ts',
  'weaving-invoice.schema.ts': 'weaving-invoices.schema.ts',
  'shipment.schema.ts': 'shipments.schema.ts',
};

const importMap = Object.entries(renameMap).map(([oldName, newName]) => ({
  oldImport: oldName.replace('.ts', ''),
  newImport: newName.replace('.ts', ''),
}));

// 1. Rename files in src/schema
const schemaDir = path.join(process.cwd(), 'src', 'schema');
if (fs.existsSync(schemaDir)) {
  for (const [oldName, newName] of Object.entries(renameMap)) {
    const oldPath = path.join(schemaDir, oldName);
    const newPath = path.join(schemaDir, newName);
    if (fs.existsSync(oldPath)) {
      if (fs.existsSync(newPath)) {
        // if newPath already exists, don't overwrite blindly
        console.log(
          `Skipping renaming ${oldName} to ${newName} because target already exists`,
        );
      } else {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${oldName} -> ${newName}`);
      }
    }
  }
}

// 2. Find and replace imports in .ts and .tsx files
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

      for (const { oldImport, newImport } of importMap) {
        // Regex to match imports exactly: ./customer.schema or @/schema/customer.schema or ../../schema/customer.schema
        // Avoid matching customers.schema if old is customer.schema
        const regex = new RegExp(`(['"\`/])(.*?)(${oldImport})(['"\`])`, 'g');
        const newContent = content.replace(regex, (match, p1, p2, p3, p4) => {
          // ensure the character right before is / or .
          return `${p1}${p2}${newImport}${p4}`;
        });

        if (content !== newContent) {
          content = newContent;
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated imports in: ${fullPath}`);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src'));
console.log('Finished updating imports.');
