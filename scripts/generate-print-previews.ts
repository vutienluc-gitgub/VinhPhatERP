import fs from 'fs';
import path from 'path';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import type { ShipmentDocument } from '@/domain/shipments/types';
import { buildShipmentPrintHtml } from '@/features/shipments/shipment-document.template';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  console.log('Fetching shipment PXK-094...');

  // 1. Fetch shipment
  const { data: shipmentData, error } = await supabase
    .from('shipments')
    .select(
      '*, orders(order_number), customers(name, code, address, phone, contact_person), shipment_items(*)',
    )
    .eq('shipment_number', 'PXK-094')
    .single();

  if (error || !shipmentData) {
    console.error('Shipment not found:', error);
    process.exit(1);
  }

  const shipment = shipmentData as unknown as ShipmentDocument;
  const shipmentItems = shipment.shipment_items ?? [];
  const rollIds = shipmentItems
    .map((item) => item.finished_roll_id)
    .filter((id): id is string => !!id);

  if (rollIds.length > 0) {
    const { data: rolls } = await supabase
      .from('finished_fabric_rolls')
      .select('id, roll_number, color_name, length_m, warehouse_location')
      .in('id', rollIds);

    const rollMap = new Map((rolls ?? []).map((r) => [r.id, r]));

    shipment.shipment_items = shipmentItems.map((item) => {
      const roll = item.finished_roll_id
        ? rollMap.get(item.finished_roll_id)
        : undefined;
      return {
        ...item,
        color_name: item.color_name ?? roll?.color_name ?? null,
        roll_number: roll?.roll_number ?? null,
        roll_length_m: roll?.length_m ?? null,
        warehouse_location: roll?.warehouse_location ?? null,
      };
    });
  }

  // 2. Build A4 Print HTML
  console.log('Generating A4 print template...');
  const a4Result = await buildShipmentPrintHtml(shipment, {
    format: 'A4',
    companyName: 'CÔNG TY TNHH SX TM DỆT MAY VĨNH PHÁT',
    createdByName: 'Trần Quốc Tài',
  });

  // 3. Build A5 Dot Matrix Print HTML
  console.log('Generating A5 Dot Matrix print template...');
  const a5Result = await buildShipmentPrintHtml(shipment, {
    format: 'A5_DOT_MATRIX',
    companyName: 'CÔNG TY TNHH SX TM DỆT MAY VĨNH PHÁT',
    createdByName: 'Trần Quốc Tài',
    showMarginToolbar: true,
  });

  // 4. Save to public directory for instant browser viewing
  const publicDir = path.resolve('public', 'previews');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const a4Path = path.join(publicDir, 'pxk_094_a4.html');
  const a5Path = path.join(publicDir, 'pxk_094_a5.html');

  fs.writeFileSync(a4Path, a4Result.html, 'utf8');
  fs.writeFileSync(a5Path, a5Result.html, 'utf8');

  console.log('✓ Đã tạo thành công 2 file preview in:');
  console.log('  1. Bản A4:', a4Path);
  console.log('  2. Bản A5 kim (Dot Matrix):', a5Path);
}

main().catch(console.error);
