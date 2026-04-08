const fs = require('fs');
const path = require('path');

function processFile(file, hookModule) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Remove `useActiveCustomers,` from the existing import
  const hookImportRegex = new RegExp(`\\s*useActiveCustomers,?\\s*`, 'g');
  if (
    content.includes('useActiveCustomers') &&
    !content.includes('@/shared/hooks/useActiveCustomers')
  ) {
    // We only remove from local hook import if it's there
    content = content.replace(hookImportRegex, (match) => {
      // If it's part of import { ..., useActiveCustomers, ... } it will be removed.
      return match.includes('\\n') ? '\\n' : ' ';
    });

    // Add import { useActiveCustomers } from '@/shared/hooks/useActiveCustomers'
    const newImport = `import { useActiveCustomers } from '@/shared/hooks/useActiveCustomers'\n`;
    content = content.replace(
      /^(\s*import .*from .*[\r\n]+)/m,
      newImport + '$1',
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed useActiveCustomers in', file);
  }
}

processFile(
  path.join(__dirname, 'src', 'features', 'orders', 'OrderForm.tsx'),
  './useOrders',
);
processFile(
  path.join(__dirname, 'src', 'features', 'quotations', 'QuotationForm.tsx'),
  './useQuotations',
);
