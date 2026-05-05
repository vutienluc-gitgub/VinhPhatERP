import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

import eastinoSeedData from '@/master-data/seed/eastino-knitting-machine.seed';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('🔄 Bắt đầu import dữ liệu 18 máy EASTINO vào ncc-002...');

  // 1. Tìm supplier ncc-002
  const { data: suppliers, error: supErr } = await supabase
    .from('suppliers')
    .select('id, code, name')
    .ilike('code', '%ncc-002%');

  if (supErr) {
    console.error('❌ Lỗi khi tìm nhà cung cấp:', supErr.message);
    process.exit(1);
  }

  if (!suppliers || suppliers.length === 0) {
    console.error('❌ Không tìm thấy nhà cung cấp nào có mã chứa "ncc-002"');
    process.exit(1);
  }

  const targetSupplier = suppliers[0];
  console.log(
    `✅ Đã tìm thấy nhà cung cấp: ${targetSupplier.code} - ${targetSupplier.name}`,
  );

  // Get tenant_id from the first row in tenants, since this is a script
  const { data: tenants, error: tenantErr } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);
  if (tenantErr || !tenants || tenants.length === 0) {
    console.error('❌ Không tìm thấy tenant nào trong DB');
    process.exit(1);
  }
  const tenantId = tenants[0].id;

  // 2. Map data
  const { machines } = eastinoSeedData;
  const loomsToInsert = machines.map((m, i) => {
    // Generate a unique code using SKU
    const loomCode = `LOOM-${targetSupplier.code}-${m.sku.split('-').pop()}-${i + 1}`;

    // Convert specifications
    const specs = m.specifications as Record<string, number | string | null>;

    return {
      tenant_id: tenantId,
      code: loomCode,
      name: m.name,
      loom_type: 'other', // Mặc định là 'other' vì catalog là máy dệt kim tròn
      supplier_id: targetSupplier.id,
      diameter_inch: specs?.diameter_inch ?? null,
      gauge: specs?.gauge ?? null,
      feeders: specs?.feeders ?? null,
      motor_power_kw: specs?.motor_power_kw ?? null,
      voltage: specs?.voltage ?? null,
      weight_kg: specs?.weight_kg ?? null,
      max_speed_rpm: specs?.speed_rpm ?? null,
      status: 'active',
      notes: `${m.description}\n\nĐặc điểm: ${m.features.join(', ')}`,
    };
  });

  // 3. Thực hiện insert qua rpc hoặc insert trực tiếp (bypass RLS bằng cách gọi DB function hoặc dùng service_role)
  // Nhưng vì ta dùng ANON_KEY, RLS có thể chặn insert.
  // Cách tốt nhất là dùng service_role nếu có, nhưng ở đây dùng supabase.rpc('rpc_create_loom') có thể không có.
  // Thử insert trực tiếp trước
  console.log(`📦 Đang chuẩn bị insert ${loomsToInsert.length} máy...`);

  const { data: insertedData, error: insertErr } = await supabase
    .from('looms')
    .insert(loomsToInsert)
    .select();

  if (insertErr) {
    console.error('❌ Lỗi khi insert máy:', insertErr.message);
    process.exit(1);
  }

  console.log(
    `🎉 Thành công! Đã import ${insertedData?.length || 0} máy vào hệ thống.`,
  );
}

run().catch(console.error);
