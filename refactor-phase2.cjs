const fs = require('fs');
const path = require('path');

const mappings = {
  'customer.ts': 'customers',
  'supplier.ts': 'suppliers',
  'inventory.ts': 'inventory',
  'profile.ts': 'settings', // going to settings since profile feature usually pairs with settings
};

const exportedTypesForFeature = {
  customers: [
    'Customer',
    'CustomerInsert',
    'CustomerUpdate',
    'CustomersFilter',
  ],
  suppliers: ['Supplier', 'SupplierInsert', 'SupplierUpdate', 'SupplierFilter'],
  inventory: [
    'InventoryAdjustment',
    'InventoryAdjustmentInsert',
    'InventoryAdjustmentUpdate',
  ],
  settings: ['Profile', 'ProfileInsert', 'ProfileUpdate'],
};

const modelsDir = path.join(process.cwd(), 'src/models');
const featuresDir = path.join(process.cwd(), 'src/features');
const srcDir = path.join(process.cwd(), 'src');

// 1. Move contents
for (const [file, feature] of Object.entries(mappings)) {
  const srcPath = path.join(modelsDir, file);
  if (!fs.existsSync(srcPath)) continue;

  const content = fs.readFileSync(srcPath, 'utf8');
  const featTypesPath = path.join(featuresDir, feature, 'types.ts');

  if (fs.existsSync(featTypesPath)) {
    fs.appendFileSync(featTypesPath, '\n' + content);
  } else {
    fs.mkdirSync(path.join(featuresDir, feature), { recursive: true });
    fs.writeFileSync(featTypesPath, content);
  }

  fs.unlinkSync(srcPath);
  console.log(`Moved ${file} to ${feature}/types.ts`);
}

// 2. Remove from index.ts
const indexPath = path.join(modelsDir, 'index.ts');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  for (const file of Object.keys(mappings)) {
    const base = file.replace('.ts', '');
    indexContent = indexContent.replace(
      new RegExp(`export \\* from '\\.\\/${base}';\\n?`, 'g'),
      '',
    );
  }
  fs.writeFileSync(indexPath, indexContent);
}

// 3. Refactor imports in all .ts, .tsx files
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

// Map type -> feature path
const typeToFeatPath = {};
for (const [feat, types] of Object.entries(exportedTypesForFeature)) {
  for (const t of types) {
    typeToFeatPath[t] = `@/features/${feat}/types`;
  }
}

walk(srcDir, (p) => {
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;

  // Handle direct imports like: import type { Customer } from '@/models/customer';
  for (const [file, feature] of Object.entries(mappings)) {
    const base = file.replace('.ts', '');
    const regex = new RegExp(`from\\s+['"]@/models/${base}['"];?`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from '@/features/${feature}/types';`);
      changed = true;
    }
  }

  // Handle grouped imports: import type { Customer, Order } from '@/models';
  const importRegex =
    /import\s+(type\s+)?{([^}]+)}\s+from\s+['"]@\/models['"];?/g;
  let newContent = content.replace(importRegex, (match, typeKw, inside) => {
    typeKw = typeKw || '';
    const items = inside
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const kept = [];
    const moved = {};

    for (const item of items) {
      // item might be "Customer", or "Customer as Cust"
      const typeName = item.split(' as ')[0].trim();
      if (typeToFeatPath[typeName]) {
        const featPath = typeToFeatPath[typeName];
        if (!moved[featPath]) moved[featPath] = [];
        moved[featPath].push(item);
      } else {
        kept.push(item);
      }
    }

    if (Object.keys(moved).length === 0) return match; // nothing to rewrite

    let result = '';
    if (kept.length > 0) {
      result += `import ${typeKw}{ ${kept.join(', ')} } from '@/models';\n`;
    }
    for (const [featPath, importedTypes] of Object.entries(moved)) {
      result += `import ${typeKw}{ ${importedTypes.join(', ')} } from '${featPath}';\n`;
    }

    return result.trim(); // replace original block
  });

  if (content !== newContent || changed) {
    fs.writeFileSync(p, newContent);
    console.log(`Refactored imports in ${p}`);
  }
});

console.log('Phase 2 completed.');
