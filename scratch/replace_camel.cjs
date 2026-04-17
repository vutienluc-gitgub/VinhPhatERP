const fs = require('fs');
const path = require('path');

const mappings = {
  yarnCatalogId: 'yarn_catalog_id',
  yarnType: 'yarn_type',
  colorName: 'color_name',
  unitPrice: 'unit_price',
  lotNumber: 'lot_number',
  tensileStrength: 'tensile_strength',
  receiptNumber: 'receipt_number',
  supplierId: 'supplier_id',
  receiptDate: 'receipt_date',
  companyName: 'company_name',
  confirmPassword: 'confirm_password',
  destinationArea: 'destination_area',
  ratePerTrip: 'rate_per_trip',
  ratePerMeter: 'rate_per_meter',
  ratePerKg: 'rate_per_kg',
  loadingFee: 'loading_fee',
  minCharge: 'min_charge',
  isActive: 'is_active',
  customerId: 'customer_id',
  shipmentDate: 'shipment_date',
  rollIds: 'roll_ids',
  pricePerMeter: 'price_per_meter',
  finishedRollId: 'finished_roll_id',
  fabricType: 'fabric_type',
  shipmentNumber: 'shipment_number',
  orderId: 'order_id',
  deliveryAddress: 'delivery_address',
  deliveryStaffId: 'delivery_staff_id',
  vehicleId: 'vehicle_id',
  totalDistanceKm: 'total_distance_km',
  expectedDeliveryDate: 'expected_delivery_date',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [camel, snake] of Object.entries(mappings)) {
    // Regex matching exact word boundary
    const regex = new RegExp(`\\b${camel}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, snake);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(file)) walk(p);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(p);
    }
  }
}

walk(path.join(process.cwd(), 'src'));
