const fs = require('fs');
const path = require('path');

const mappings = {
  'order.ts': 'orders',
  'order-progress.ts': 'order-progress',
  'shipment.ts': 'shipments',
  'payment.ts': 'payments'
};

const exportedTypesForFeature = {
  'orders': ['Order', 'OrderInsert', 'OrderUpdate', 'OrderItem', 'OrderItemInsert', 'OrderItemUpdate', 'OrdersFilter'],
  'order-progress': ['OrderProgress', 'OrderProgressInsert', 'OrderProgressUpdate', 'OrderProgressWithOrder'],
  'shipments': ['ShipmentItem', 'ShipmentItemInsert', 'Shipment', 'ShipmentInsert', 'ShipmentUpdate', 'ShipmentsFilter'],
  'payments': ['Payment', 'PaymentInsert', 'PaymentUpdate', 'PaymentsFilter', 'DebtSummaryRow', 'Expense', 'ExpenseInsert', 'ExpenseUpdate', 'PaymentAccount', 'PaymentAccountInsert', 'PaymentAccountUpdate']
};

const modelsDir = path.join(process.cwd(), 'src/models');
const featuresDir = path.join(process.cwd(), 'src/features');
const srcDir = path.join(process.cwd(), 'src');

for (const [file, feature] of Object.entries(mappings)) {
  const srcPath = path.join(modelsDir, file);
  if (!fs.existsSync(srcPath)) continue;
  
  let content = fs.readFileSync(srcPath, 'utf8');
  const featTypesPath = path.join(featuresDir, feature, 'types.ts');
  
  // To avoid duplicate export/import issues, we replace "import type { TableRow, ... } from '@/shared/types/database.models';"
  // with "export type { TableRow, TableInsert, TableUpdate } from '@/shared/types/database.models';" IF we want them re-exported.
  // Actually, we don't need to re-export TableRow. We will just leave them as imports.
  // We'll prepend existing types.ts content so we don't lose the schema export.

  if (fs.existsSync(featTypesPath)) {
    const existingContent = fs.readFileSync(featTypesPath, 'utf8');
    fs.writeFileSync(featTypesPath, existingContent + '\n' + content);
  } else {
    fs.mkdirSync(path.join(featuresDir, feature), { recursive: true });
    fs.writeFileSync(featTypesPath, content);
  }
  
  fs.unlinkSync(srcPath);
  console.log(`Moved ${file} to ${feature}/types.ts`);
}

const indexPath = path.join(modelsDir, 'index.ts');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  for (const file of Object.keys(mappings)) {
    const base = file.replace('.ts', '');
    indexContent = indexContent.replace(new RegExp(`export \\* from '\\.\\/${base}';\\n?`, 'g'), '');
  }
  fs.writeFileSync(indexPath, indexContent);
}

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      callback(p);
    }
  }
}

const typeToFeatPath = {};
for (const [feat, types] of Object.entries(exportedTypesForFeature)) {
  for (const t of types) {
    typeToFeatPath[t] = `@/features/${feat}/types`;
  }
}

walk(srcDir, (p) => {
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;

  for (const [file, feature] of Object.entries(mappings)) {
    const base = file.replace('.ts', '');
    const regex = new RegExp(`from\\s+['"]@/models/${base}['"];?`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from '@/features/${feature}/types';`);
      changed = true;
    }
  }

  const importRegex = /import\s+(type\s+)?{([^}]+)}\s+from\s+['"]@\/models['"];?/g;
  let newContent = content.replace(importRegex, (match, typeKw, inside) => {
    typeKw = typeKw || '';
    const items = inside.split(',').map(s => s.trim()).filter(Boolean);
    const kept = [];
    const moved = {};
    
    for (const item of items) {
      const typeName = item.split(' as ')[0].trim();
      if (typeToFeatPath[typeName]) {
        const featPath = typeToFeatPath[typeName];
        if (!moved[featPath]) moved[featPath] = [];
        moved[featPath].push(item);
      } else {
        kept.push(item);
      }
    }
    
    if (Object.keys(moved).length === 0) return match;
    
    let result = '';
    if (kept.length > 0) {
      result += `import ${typeKw}{ ${kept.join(', ')} } from '@/models';\n`;
    }
    for (const [featPath, importedTypes] of Object.entries(moved)) {
      result += `import ${typeKw}{ ${importedTypes.join(', ')} } from '${featPath}';\n`;
    }
    
    return result.trim();
  });

  if (content !== newContent || changed) {
    fs.writeFileSync(p, newContent);
    console.log(`Refactored imports in ${p}`);
  }
});

console.log('Phase 3 completed.');
