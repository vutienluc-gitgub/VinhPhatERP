import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing config');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const bomCode = 'BOM-FE-C01-YS-030';
  const { data: bom, error } = await supabase
    .from('bom_templates')
    .select('*, bom_yarn_items(*)')
    .eq('code', bomCode)
    .single();

  if (error || !bom) {
    console.log('BOM not found or error: ', error);
    return;
  }

  const catalogIds = bom.bom_yarn_items.map((i: unknown) => i.yarn_catalog_id);
  const { data: catalogs } = await supabase
    .from('yarn_catalogs')
    .select('id, name, code')
    .in('id', catalogIds);

  console.log('Yarns for ' + bomCode + ':');
  for (const item of bom.bom_yarn_items) {
    const catalog = catalogs?.find(
      (c: unknown) => c.id === item.yarn_catalog_id,
    );
    console.log(
      `- [${catalog?.code}] ${catalog?.name}  |  Tỉ lệ định mức: ${item.ratio_pct}%`,
    );
  }
}
check();
