const fs = require('fs');
const path = require('path');

const files = [
  'ContractsPage.tsx',
  'ContractTemplatesPage.tsx',
  'BomListPage.tsx',
  'BomPage.tsx',
  'EmployeeListPage.tsx',
  'InventoryPage.tsx',
  'OrderKanbanPage.tsx',
  'ShipmentsPage.tsx',
  'WeavingInvoicesPage.tsx',
  'WorkOrderPage.tsx'
];

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath));
    } else {
      if (files.includes(file)) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const foundFiles = findFiles('d:/VinhPhatERP_v3/src/features');

for (const file of foundFiles) {
  let text = fs.readFileSync(file, 'utf8');
  if (!text.includes('className="page-container"')) {
    // Replace the first 'return (\n    <div className="panel-card' with page-container wrapper
    const newText = text.replace(
      /return\s*\(\s*<div\s+className="panel-card/g,
      'return (\n    <div className="page-container">\n    <div className="panel-card'
    ).replace(
      /    <\/div>\s*\)\s*;\s*\}\s*$/g,
      '    </div>\n    </div>\n  );\n}\n'
    );
    
    if (newText !== text) {
      fs.writeFileSync(file, newText);
      console.log('Fixed ' + file);
    }
  }
}
