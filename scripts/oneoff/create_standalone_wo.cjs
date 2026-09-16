const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    if (line.includes('VITE_SUPABASE_URL='))
      supabaseUrl = line.split('=')[1].trim();
    if (line.includes('VITE_SUPABASE_ANON_KEY='))
      supabaseKey = line.split('=')[1].trim();
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStandaloneWO() {
  // 1. Find a valid BOM
  const { data: bom, error: bomError } = await supabase
    .from('bom_templates')
    .select('id, code, name')
    .eq('status', 'approved')
    .limit(1)
    .single();

  if (bomError) {
    console.error('No approved BOM found, trying any BOM', bomError);
    const { data: anyBom, error: anyBomError } = await supabase
      .from('bom_templates')
      .select('id, code, name')
      .limit(1)
      .single();
    if (anyBomError) {
      console.error('No BOM found at all.');
      return;
    }
    // We might need to approve it first if it's draft, but let's try
  }

  const selectedBom = bom || anyBom;
  console.log('Using BOM:', selectedBom.name);

  // 2. Create standalone Work Order
  const woNumber = 'WO-STANDALONE-' + Date.now();
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .insert({
      work_order_number: woNumber,
      order_id: null,
      bom_template_id: selectedBom.id,
      bom_version: 1, // Assume 1
      target_quantity_m: 100,
      target_unit: 'm',
      target_weight_kg: 25,
      status: 'draft',
    })
    .select()
    .single();

  if (woError) {
    console.error('Error creating WO:', woError);
    return;
  }

  console.log('Created standalone Work Order:', wo.work_order_number);

  // 3. Manually trigger progress rows (as done in createWorkOrder in API)
  const stages = [
    'warping',
    'weaving',
    'greige_check',
    'dyeing',
    'finishing',
    'final_check',
    'packing',
  ];
  const progressRows = stages.map((stage) => ({
    work_order_id: wo.id,
    order_id: null,
    stage,
    status: 'pending',
  }));

  const { error: progressErr } = await supabase
    .from('order_progress')
    .insert(progressRows);

  if (progressErr) {
    console.error('Error creating progress rows:', progressErr);
  } else {
    console.log('Successfully created 7 progress stages for standalone WO.');
  }
}

createStandaloneWO();
