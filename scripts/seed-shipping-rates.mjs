import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id || null;

  const { data, error } = await supabase.from('shipping_rates').insert([
    {
      tenant_id: tenantId,
      name: 'Nội thành TP.HCM',
      destination_area: 'Hồ Chí Minh',
      rate_per_trip: 300000,
      rate_per_meter: null,
      rate_per_kg: null,
      loading_fee: 50000,
      min_charge: 350000,
      is_active: true,
      notes: 'Giao hàng trong ngày'
    },
    {
      tenant_id: tenantId,
      name: 'Ngoại thành TP.HCM',
      destination_area: 'Hồ Chí Minh',
      rate_per_trip: 450000,
      rate_per_meter: null,
      rate_per_kg: null,
      loading_fee: 50000,
      min_charge: 500000,
      is_active: true,
      notes: 'Củ Chi, Cần Giờ, Nhà Bè'
    },
    {
      tenant_id: tenantId,
      name: 'Chành xe đi tỉnh',
      destination_area: 'Các tỉnh lân cận',
      rate_per_trip: null,
      rate_per_meter: null,
      rate_per_kg: 2000,
      loading_fee: 100000,
      min_charge: 300000,
      is_active: true,
      notes: 'Giá theo kiện/kg gửi chành xe'
    }
  ]);
  console.log('Error:', error);
  console.log('Inserted seed data:', data);
}

main();
