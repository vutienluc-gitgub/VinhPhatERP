const fs = require('fs');
const cp = require('child_process');

const blobs = cp
  .execSync('git fsck --lost-found')
  .toString()
  .split('\n')
  .filter((l) => l.includes('blob'))
  .map((l) => l.split(' ')[2]);

console.log(`Searching through ${blobs.length} blobs...`);

for (const b of blobs) {
  if (!b) continue;
  try {
    const content = cp
      .execSync(`git show ${b}`, { maxBuffer: 10 * 1024 * 1024 })
      .toString();

    if (content.includes('function SupplierPaymentSheet')) {
      console.log(`Found SupplierPaymentSheet in blob ${b}`);
      fs.writeFileSync(
        'src/features/suppliers/SupplierPaymentSheet.tsx',
        content,
      );
    } else if (content.includes('export function useSupplierDebt')) {
      console.log(`Found useSupplierDebt in blob ${b}`);
      fs.writeFileSync('src/features/suppliers/useSupplierDebt.ts', content);
    } else if (
      content.includes('export function PaymentSheet') &&
      content.includes('shipment')
    ) {
      console.log(`Found PaymentSheet in blob ${b}`);
      fs.writeFileSync('src/features/shipments/PaymentSheet.tsx', content);
    } else if (content.includes('export function ShipmentCreateSheet')) {
      console.log(`Found ShipmentCreateSheet in blob ${b}`);
      fs.writeFileSync(
        'src/features/shipments/ShipmentCreateSheet.tsx',
        content,
      );
    } else if (content.includes('export function usePayDebt')) {
      console.log(`Found usePayDebt in blob ${b}`);
      fs.writeFileSync('src/features/shipments/usePayDebt.ts', content);
    } else if (content.includes('export function useShipmentPrint')) {
      console.log(`Found useShipmentPrint in blob ${b}`);
      fs.writeFileSync('src/features/shipments/useShipmentPrint.ts', content);
    }
  } catch (e) {}
}
console.log('Done searching blobs.');
