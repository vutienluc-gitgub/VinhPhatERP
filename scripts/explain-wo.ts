import * as dotenv from 'dotenv';

import { untypedDb } from '@/services/supabase/untyped';
dotenv.config({ path: '.env.local' });

async function explain() {
  const woNumber = 'WO-202604-321';
  console.log(`Fetching info for ${woNumber}...`);

  const { data: wo } = await untypedDb
    .from('work_orders')
    .select('*, bom_templates(id, code, standard_loss_pct, bom_yarn_items(*))')
    .eq('work_order_number', woNumber)
    .single();

  if (!wo) {
    console.log('Not found');
    return;
  }

  const bom = wo.bom_templates;
  if (!bom) {
    console.log('No BOM');
    return;
  }

  const targetWeight = wo.target_weight_kg;
  const targetQuantity = wo.target_quantity_m;
  const weavingPrice = wo.weaving_unit_price;
  const lossPct = wo.standard_loss_pct || bom.standard_loss_pct || 5;

  const catalogIds = bom.bom_yarn_items
    .map((i: unknown) => i.yarn_catalog_id)
    .filter(Boolean);

  const { data: receipts } = await untypedDb
    .from('yarn_receipt_items')
    .select('yarn_catalog_id, unit_price, id')
    .in('yarn_catalog_id', catalogIds)
    .order('id', { ascending: false });

  const priceMap: Record<string, number> = {};
  for (const r of receipts || []) {
    if (!priceMap[r.yarn_catalog_id]) {
      priceMap[r.yarn_catalog_id] = r.unit_price;
    }
  }

  console.log('Target Weight (kg):', targetWeight);
  console.log('Target Qty (m):', targetQuantity);
  console.log('Weaving Price:', weavingPrice);
  console.log('Loss %:', lossPct);

  let totalValue = 0;
  let totalKg = 0;

  console.log('\nYarns in BOM:');
  for (const item of bom.bom_yarn_items) {
    const requiredKg = item.consumption_kg_per_m * targetQuantity; // approximate
    const price = priceMap[item.yarn_catalog_id] || 0;
    console.log(
      `- Yarn ${item.yarn_catalog_id}: reqKg=${requiredKg}, price=${price}`,
    );
    if (price && requiredKg) {
      totalValue += price * requiredKg;
      totalKg += requiredKg;
    }
  }

  const suggestedAverage = totalKg > 0 ? Math.round(totalValue / totalKg) : 0;
  console.log(
    `\n=> Suggested Avg Yarn Price: ${suggestedAverage} (Value: ${totalValue} / Kg: ${totalKg})`,
  );

  const estYarnPrice = suggestedAverage;
  const baseCost = targetWeight * estYarnPrice;
  const wasteCost = baseCost * (lossPct / 100);
  const processingCost = weavingPrice * targetQuantity;
  const totalCost = baseCost + wasteCost + processingCost;
  const finalPrice = totalCost * 1.15;

  console.log('\n--- CALCULATIONS ---');
  console.log(`Base Cost: ${targetWeight} * ${estYarnPrice} = ${baseCost}`);
  console.log(`Waste Cost: ${baseCost} * ${lossPct / 100} = ${wasteCost}`);
  console.log(
    `Processing Cost: ${targetQuantity} * ${weavingPrice} = ${processingCost}`,
  );
  console.log(`Total Cost: ${totalCost}`);
  console.log(`Final Price (1.15): ${finalPrice}`);
  console.log(`Price per meter: ${finalPrice / targetQuantity}`);
}

explain();
