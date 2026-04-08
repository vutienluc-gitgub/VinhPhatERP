const fs = require('fs');
const path = require('path');

const dir = '.git/lost-found/other';
if (!fs.existsSync(dir)) {
  console.log('No lost-found dir');
  process.exit();
}

const files = fs.readdirSync(dir);
console.log(`Searching through ${files.length} retrieved blobs...`);

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');

  if (content.includes('function SupplierPaymentSheet')) {
    console.log(`Found SupplierPaymentSheet in blob ${f}`);
    fs.writeFileSync(
      'src/features/suppliers/SupplierPaymentSheet.tsx',
      content,
    );
  } else if (content.includes('export function useSupplierDebt')) {
    console.log(`Found useSupplierDebt in blob ${f}`);
    fs.writeFileSync('src/features/suppliers/useSupplierDebt.ts', content);
  } else if (
    content.includes('function PaymentSheet') &&
    content.includes('shipment')
  ) {
    console.log(`Found PaymentSheet in blob ${f}`);
    fs.writeFileSync('src/features/shipments/PaymentSheet.tsx', content);
  } else if (content.includes('function ShipmentCreateSheet')) {
    console.log(`Found ShipmentCreateSheet in blob ${f}`);
    fs.writeFileSync('src/features/shipments/ShipmentCreateSheet.tsx', content);
  } else if (content.includes('export function usePayDebt')) {
    console.log(`Found usePayDebt in blob ${f}`);
    fs.writeFileSync('src/features/shipments/usePayDebt.ts', content);
  } else if (content.includes('export function useShipmentPrint')) {
    console.log(`Found useShipmentPrint in blob ${f}`);
    fs.writeFileSync('src/features/shipments/useShipmentPrint.ts', content);
  } else if (content.includes('function DebtSummaryCard')) {
    console.log(`Found DebtSummaryCard in blob ${f}`);
    fs.writeFileSync('src/features/customers/DebtSummaryCard.tsx', content);
  } else if (content.includes('function SupplierDebtSummaryCard')) {
    console.log(`Found SupplierDebtSummaryCard in blob ${f}`);
    fs.writeFileSync(
      'src/features/suppliers/SupplierDebtSummaryCard.tsx',
      content,
    );
  } else if (content.includes('function DebtTransactionList')) {
    console.log(`Found DebtTransactionList in blob ${f}`);
    fs.writeFileSync('src/features/customers/DebtTransactionList.tsx', content);
  } else if (content.includes('export function useDebt')) {
    console.log(`Found useDebt in blob ${f}`);
    fs.writeFileSync('src/features/customers/useDebt.ts', content);
  } else if (content.includes('export const WORK_ORDER_STATUSES')) {
    console.log(`Found work-orders.module in blob ${f}`);
    // just save it to tmp to see
    fs.writeFileSync('tmp-wo.ts', content);
  }
}
console.log('Done searching blobs.');
