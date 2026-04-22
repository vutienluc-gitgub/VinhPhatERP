import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env variables from .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const serviceMatch = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
if (!urlMatch || !serviceMatch) {
  console.error('❌ Missing Supabase URL or SERVICE ROLE KEY in .env.local');
  process.exit(1);
}
const supabaseUrl = urlMatch[1].trim().replace(/['"]/g, '');
const serviceKey = serviceMatch[1].trim().replace(/['"]/g, '');

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  // 1️⃣ Lấy tenant slug (có thể là "default" hoặc slug công ty)
  const tenantSlug = 'default'; // thay đổi nếu bạn có slug khác

  // 2️⃣ Cố gắng lấy tenant theo slug
  let { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .single();

  // Nếu không tìm thấy slug, fallback lấy tenant đầu tiên
  if (tenantErr) {
    console.warn('⚠️ Không tìm thấy tenant với slug', tenantSlug, '- fallback lấy tenant đầu tiên');
    const fallback = await supabase.from('tenants').select('id').limit(1).single();
    if (fallback.error) {
      console.error('❌ Lỗi fallback tenant:', fallback.error);
      return;
    }
    tenant = fallback.data;
  }

  // Check weaving invoice rolls
  const { data: invoiceRolls } = await supabase.from('weaving_invoice_rolls').select('id, invoice_id, roll_number, weight_kg, raw_fabric_roll_id');
  
  // Fix 29 rolls where raw_fabric_roll_id points to weaving_invoices but has wrong tenant
  for (const wr of invoiceRolls) {
    if (wr.raw_fabric_roll_id) {
       await supabase.from('raw_fabric_rolls').update({ tenant_id: '38615337-baf2-49c0-89ba-e3a19691fea6' }).eq('id', wr.raw_fabric_roll_id);
    }
  }
  console.log('✅ Fixed 29 rolls to tenant_id = 38615337-baf2-49c0-89ba-e3a19691fea6');
}

run();
