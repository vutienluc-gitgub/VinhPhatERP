const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const TENANT_ID = '38615337-baf2-49c0-89ba-e3a19691fea6';
const CUSTOMER_ID = 'd4728e89-5aec-4043-b8a5-f34a1aec6c46'; // KH-025 Futuristic

// Chi tiết 45 cây vải nỉ cào xám tiêu (kg)
const NI_WEIGHTS = [
  // Cột 1
  22.8, 24.3, 23.9, 21.6, 23.0, 22.8, 23.4, 23.1, 24.5, 24.1,
  // Cột 2
  23.8, 22.6, 23.7, 24.0, 23.8, 22.9, 23.5, 24.2, 22.5, 22.0,
  // Cột 3
  24.0, 23.8, 22.7, 23.5, 22.9, 23.1, 22.8, 23.4, 24.0, 22.4,
  // Cột 4
  24.3, 23.1, 22.8, 23.5, 22.9, 23.7, 22.0, 23.2, 23.6, 22.8,
  // Cột 5
  22.7, 23.0, 22.0, 22.0, 21.0
];

// Chi tiết 4 cây Bo (kg)
const BO_WEIGHTS = [21.0, 21.0, 21.0, 21.0];

async function syncPXK094() {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ PHIẾU XUẤT KHO 094 ===');

  // 1. Cập nhật khách hàng KH-025 (Futuristic / Nguyễn Thiên Phúc)
  console.log('1. Cập nhật trạng thái KH-025...');
  const { data: customer, error: errCust } = await supabase
    .from('customers')
    .update({
      lead_status: 'customer',
      notes: 'Đã xuất hàng theo PXK-094 ngày 26/09/2026 (Người nhận: Nguyễn Thiên Phúc)'
    })
    .eq('id', CUSTOMER_ID)
    .select()
    .single();

  if (errCust) {
    console.error('Lỗi cập nhật KH-025:', errCust);
    process.exit(1);
  }
  console.log(`✓ Đã cập nhật KH-025: ${customer.name} (Người liên hệ: ${customer.contact_person})`);

  // 2. Tạo hoặc tái sử dụng đơn hàng (Order)
  console.log('2. Kiểm tra/Tạo đơn hàng DH2609-0094...');
  const totalNiKg = NI_WEIGHTS.reduce((sum, w) => sum + w, 0); // 1041.7
  const totalBoKg = BO_WEIGHTS.reduce((sum, w) => sum + w, 0); // 84.0
  const totalKg = Number((totalNiKg + totalBoKg).toFixed(2)); // 1125.70

  let orderId;
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('order_number', 'DH2609-0094')
    .single();

  if (existingOrder) {
    orderId = existingOrder.id;
    console.log(`✓ Tái sử dụng Order đã tạo: DH2609-0094 (ID: ${orderId})`);
  } else {
    const { data: newOrder, error: errOrder } = await supabase
      .from('orders')
      .insert({
        order_number: 'DH2609-0094',
        customer_id: CUSTOMER_ID,
        order_date: '2026-09-26',
        delivery_date: '2026-09-26',
        order_type: 'fabric_sale',
        total_amount: 0,
        paid_amount: 0,
        status: 'completed',
        notes: 'Đơn hàng xuất bán theo PXK 094 ngày 26/09/2026. Người nhận: Nguyễn Thiên Phúc. Xe: 51C-766.33. Người vận chuyển: Trần Quốc Tài.',
        tenant_id: TENANT_ID
      })
      .select()
      .single();

    if (errOrder) {
      console.error('Lỗi tạo Order:', errOrder);
      process.exit(1);
    }
    orderId = newOrder.id;
    console.log(`✓ Đã tạo Order: DH2609-0094 (ID: ${orderId})`);
  }

  // 3. Tạo Order Items (nếu chưa có)
  console.log('3. Kiểm tra/Tạo chi tiết đơn hàng (order_items)...');
  const { data: existingItems } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', orderId);

  if (!existingItems || existingItems.length === 0) {
    const { error: errItems } = await supabase
      .from('order_items')
      .insert([
        {
          order_id: orderId,
          fabric_type: 'Vải nỉ cào xám tiêu',
          color_name: 'Xám tiêu',
          quantity: totalNiKg,
          unit: 'kg',
          unit_price: 0,
          sort_order: 1,
          notes: '45 cây (tổng 1.041,70 kg)',
          tenant_id: TENANT_ID
        },
        {
          order_id: orderId,
          fabric_type: 'Bo nỉ',
          color_name: 'Xám tiêu',
          quantity: totalBoKg,
          unit: 'kg',
          unit_price: 0,
          sort_order: 2,
          notes: '4 cây x 21.0 kg/cây (tổng 84,00 kg)',
          tenant_id: TENANT_ID
        }
      ]);

    if (errItems) {
      console.error('Lỗi tạo Order Items:', errItems);
      process.exit(1);
    }
    console.log('✓ Đã tạo 2 dòng order_items (Vải nỉ cào xám + Bo)');
  } else {
    console.log(`✓ Đã tồn tại ${existingItems.length} dòng order_items`);
  }

  // 4. Tạo 49 cây vải thành phẩm (finished_fabric_rolls)
  console.log('4. Kiểm tra/Tạo 49 cây vải thành phẩm với trạng thái shipped...');
  const { data: existingRolls } = await supabase
    .from('finished_fabric_rolls')
    .select('id, roll_number, weight_kg, fabric_type')
    .eq('lot_number', 'PXK-094');

  let createdRolls = existingRolls || [];
  if (createdRolls.length < 49) {
    // Xóa các roll cũ chưa đủ nếu có để insert đồng bộ sạch sẽ
    if (createdRolls.length > 0) {
      await supabase.from('finished_fabric_rolls').delete().eq('lot_number', 'PXK-094');
    }

    const rollPayloads = [];

    NI_WEIGHTS.forEach((weight, i) => {
      const idxStr = String(i + 1).padStart(2, '0');
      rollPayloads.push({
        roll_number: `PXK094-NI-${idxStr}`,
        fabric_type: 'Vải nỉ cào xám tiêu',
        color_name: 'Xám tiêu',
        weight_kg: weight,
        status: 'shipped',
        lot_number: 'PXK-094',
        production_date: '2026-09-26',
        reserved_for_order_id: orderId,
        notes: `Cây ${i + 1}/45 xuất theo PXK 094 (26/09/2026) cho KH Futuristic`,
        tenant_id: TENANT_ID
      });
    });

    BO_WEIGHTS.forEach((weight, i) => {
      const idxStr = String(i + 1).padStart(2, '0');
      rollPayloads.push({
        roll_number: `PXK094-BO-${idxStr}`,
        fabric_type: 'Bo nỉ',
        color_name: 'Xám tiêu',
        weight_kg: weight,
        status: 'shipped',
        lot_number: 'PXK-094',
        production_date: '2026-09-26',
        reserved_for_order_id: orderId,
        notes: `Bo cây ${i + 1}/4 xuất theo PXK 094 (26/09/2026)`,
        tenant_id: TENANT_ID
      });
    });

    const { data: inserted, error: errRolls } = await supabase
      .from('finished_fabric_rolls')
      .insert(rollPayloads)
      .select('id, roll_number, weight_kg, fabric_type');

    if (errRolls) {
      console.error('Lỗi tạo Finished Rolls:', errRolls);
      process.exit(1);
    }
    createdRolls = inserted;
    console.log(`✓ Đã tạo ${createdRolls.length} cây vải thành phẩm (PXK094-NI-01..45 & PXK094-BO-01..04)`);
  } else {
    console.log(`✓ Đã tồn tại ${createdRolls.length} cây vải thành phẩm cho PXK-094`);
  }

  // 5. Tạo Phiếu xuất kho (Shipments)
  console.log('5. Kiểm tra/Tạo Phiếu xuất kho PXK-094 (Shipments)...');
  let shipment;
  const { data: existingShip } = await supabase
    .from('shipments')
    .select('*')
    .eq('shipment_number', 'PXK-094')
    .single();

  if (existingShip) {
    shipment = existingShip;
    console.log(`✓ Tái sử dụng Phiếu xuất kho: PXK-094 (ID: ${shipment.id})`);
  } else {
    const { data: newShip, error: errShip } = await supabase
      .from('shipments')
      .insert({
        shipment_number: 'PXK-094',
        order_id: orderId,
        customer_id: CUSTOMER_ID,
        shipment_date: '2026-09-26',
        vehicle_info: '51C - 766.33',
        receiver_name: 'Trần Quốc Tài (Vận chuyển) / Nguyễn Thiên Phúc (Nhận hàng)',
        receiver_phone: customer.phone,
        delivery_address: customer.address || 'Kho Vĩnh Phát',
        total_weight_kg: totalKg,
        status: 'delivered',
        delivered_at: '2026-09-26T11:09:54+07:00',
        notes: 'Phiếu xuất kho số 094 ngày 26/09/2026. Xuất bán 45 cây Vải nỉ cào xám tiêu (1.041,70 kg) + 4 cây Bo nỉ (84,00 kg). Xuất tại kho Vĩnh Phát.',
        tenant_id: TENANT_ID
      })
      .select()
      .single();

    if (errShip) {
      console.error('Lỗi tạo Shipment:', errShip);
      process.exit(1);
    }
    shipment = newShip;
    console.log(`✓ Đã tạo Phiếu xuất kho: ${shipment.shipment_number} (ID: ${shipment.id})`);
  }

  // 6. Tạo chi tiết phiếu xuất kho (Shipment Items)
  console.log('6. Liên kết chi tiết từng cây vào shipment_items...');
  const { data: existingShipItems } = await supabase
    .from('shipment_items')
    .select('id')
    .eq('shipment_id', shipment.id);

  if (!existingShipItems || existingShipItems.length === 0) {
    const shipmentItemsPayload = createdRolls.map((roll, idx) => ({
      shipment_id: shipment.id,
      finished_roll_id: roll.id,
      fabric_type: roll.fabric_type,
      color_name: 'Xám tiêu',
      quantity: roll.weight_kg,
      unit: 'kg',
      sort_order: idx + 1,
      notes: `${roll.roll_number} (${roll.weight_kg} kg)`,
      price_per_meter: 0,
      tenant_id: TENANT_ID
    }));

    const { error: errShipItems } = await supabase
      .from('shipment_items')
      .insert(shipmentItemsPayload);

    if (errShipItems) {
      console.error('Lỗi tạo Shipment Items:', errShipItems);
      process.exit(1);
    }
    console.log(`✓ Đã tạo ${shipmentItemsPayload.length} dòng shipment_items liên kết trực tiếp với từng cây vải`);
  } else {
    console.log(`✓ Đã tồn tại ${existingShipItems.length} dòng shipment_items`);
  }

  console.log('\n=== ĐỒNG BỘ THÀNH CÔNG 100% ===');
  console.log(`- Khách hàng: KH-025 - Futuristic (Người nhận: Nguyễn Thiên Phúc, SĐT: ${customer.phone}, Đ/C: ${customer.address})`);
  console.log(`- Mã Đơn hàng: DH2609-0094 (ID: ${orderId})`);
  console.log(`- Mã Phiếu xuất: PXK-094 (ID: ${shipment.id})`);
  console.log(`- Phương tiện: 51C - 766.33 | Người vận chuyển: Trần Quốc Tài`);
  console.log(`- Chi tiết: 45 cây Vải nỉ cào xám tiêu (1.041,70 kg) + 4 cây Bo (84,00 kg)`);
  console.log(`- Đã đăng ký 49 cây vải thành phẩm trong kho với mã PXK094-NI-01..45 & PXK094-BO-01..04`);
  console.log(`- Tổng trọng lượng: ${totalKg} kg`);
}

syncPXK094();
