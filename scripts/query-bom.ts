import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing config');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const { data: bom, error } = await supabase
    .from('bom_templates')
    .select('id, code, name, bom_yarn_items(yarn_catalog_id, ratio_pct)')
    .or(`code.eq.BOM-FC-001-YS-008,code.eq.BOM-FE-C01-YS-008,name.ilike.%008%`)
    .limit(1)
    .single();

  if (error || !bom) {
    console.log('BOM error:', error);
    return;
  }

  console.log('Found BOM:', bom.code, '-', bom.name);

  const ids = bom.bom_yarn_items.map((i: unknown) => i.yarn_catalog_id);

  const { data: catalogs } = await supabase
    .from('yarn_catalogs')
    .select('id, name, code')
    .in('id', ids);

  const { data: receipts } = await supabase
    .from('yarn_receipt_items')
    .select('yarn_catalog_id, unit_price, id')
    .in('yarn_catalog_id', ids)
    .order('id', { ascending: false });

  const priceMap: Record<string, number> = {};
  for (const r of receipts || []) {
    if (!priceMap[r.yarn_catalog_id]) {
      priceMap[r.yarn_catalog_id] = r.unit_price;
    }
  }

  for (const item of bom.bom_yarn_items) {
    const c = catalogs?.find((x: unknown) => x.id === item.yarn_catalog_id);
    const price = priceMap[item.yarn_catalog_id]
      ? priceMap[item.yarn_catalog_id] + ' đ'
      : 'Chưa có dữ liệu nhập';
    console.log(`\n- Tên sợi: ${c?.name} (${c?.code})`);
    console.log(`  Tỉ lệ:   ${item.ratio_pct}%`);
    console.log(`  Đơn giá mới nhất: ${price}`);
  }
}
run();
