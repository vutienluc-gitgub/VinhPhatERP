const fs = require('fs');
const path = require('path');

const filesToUpdate = {
  'src/features/orders/OrderList.tsx': 'ORDERS_LIST_LABELS',
  'src/features/orders/OrderDetail.tsx': 'ORDERS_LIST_LABELS',
  'src/features/orders/OrderAuditLogViewer.tsx': 'ORDERS_LIST_LABELS',
  'src/features/orders/OrderForm.tsx': 'ORDERS_FORM_LABELS',
  'src/features/orders/hooks/useOrderColumns.tsx': 'ORDERS_LIST_LABELS',
  'src/features/orders/dashboard/components/OrderFulfillmentTable.tsx': 'ORDERS_LIST_LABELS',
  'src/features/orders/dashboard/components/FulfillmentKpiCards.tsx': 'ORDERS_DASHBOARD_LABELS',
  'src/features/orders/CreditOverrideDialog.tsx': 'ORDERS_OVERRIDE_LABELS',
  'src/features/orders/components/ItemQuantityFields.tsx': 'ORDERS_FORM_LABELS',
  'src/features/orders/components/OrderFormHelpers.tsx': 'ORDERS_FORM_LABELS',
  'src/features/orders/components/ProductionItemRow.tsx': 'ORDERS_FORM_LABELS',
  'src/features/orders/components/OrderMobileCard.tsx': 'ORDERS_LIST_LABELS',
};

for (const [file, label] of Object.entries(filesToUpdate)) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the import
    content = content.replace(
      /import\s+\{\s*ORDER_MESSAGES\s+as\s+MSG\s*\}\s+from\s+['"](.*?)['"];/,
      `import { ${label} as MSG } from '$1';`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}
