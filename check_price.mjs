import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: bomYarns } = await supabase
    .from('bom_yarn_items')
    .select('*, bom_templates!inner(code, standard_loss_pct), yarn_catalogs(code, name)')
    .eq('bom_templates.code', 'BOM-FC-003-YS-001');
  
  const yarnIds = [...new Set(bomYarns.map(y => y.yarn_catalog_id))];

  const { data: prices } = await supabase
    .from('yarn_receipt_items')
    .select('yarn_catalog_id, unit_price, id')
    .in('yarn_catalog_id', yarnIds)
    .order('id', { ascending: false });

  const priceMap = {};
  for (const p of prices) {
    if (!priceMap[p.yarn_catalog_id]) priceMap[p.yarn_catalog_id] = p.unit_price;
  }
  
  const uniqueYarns = {};
  for (const y of bomYarns) {
     if (!uniqueYarns[y.yarn_catalog_id]) {
         uniqueYarns[y.yarn_catalog_id] = { ...y };
     }
  }
  
  let totalCost = 0;
  const standardLoss = 1;
  const targetQuantity = 1;
  const targetWeightKg = targetQuantity;
  
  const totalRequiredWithLoss = targetWeightKg / (1 - standardLoss / 100);
  
  for (const key of Object.keys(uniqueYarns)) {
      const req = uniqueYarns[key];
      const ratio = req.ratio_pct / 100;
      const requiredKg = Number((totalRequiredWithLoss * ratio).toFixed(2));
      const price = priceMap[key] || 0;
      
      const itemCost = requiredKg * price;
      totalCost += itemCost;
      
      console.log(`- ${req.yarn_catalogs.name}: ratio=${req.ratio_pct}%, required_kg=${requiredKg}, price=${price}, item_cost=${itemCost}`);
  }
  
  console.log('Total Cost:', Math.round(totalCost));
}
run();
