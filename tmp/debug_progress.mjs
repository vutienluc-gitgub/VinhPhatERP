import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env
const envRaw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envRaw.split('\n')) {
  if (!line.includes('=') || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  env[line.slice(0, i).trim()] = line
    .slice(i + 1)
    .trim()
    .replace(/^["']|["']$/g, '');
}

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY,
);

async function debug() {
  console.log('\n=== 1. Recent work_orders ===');
  const { data: wos, error: woErr } = await supabase
    .from('work_orders')
    .select('id, work_order_number, status, order_id')
    .order('created_at', { ascending: false })
    .limit(5);
  if (woErr) console.error('WO error:', woErr.message);
  else console.table(wos);

  console.log('\n=== 2. order_progress rows (all) ===');
  const { data: progress, error: pErr } = await supabase
    .from('order_progress')
    .select('*')
    .limit(20);
  if (pErr) {
    console.error('Progress error:', pErr.message);
  } else if (!progress?.length) {
    console.log('⚠️  NO ROWS in order_progress!');
  } else {
    console.log('Row count:', progress.length);
    for (const p of progress) {
      console.log({
        id: p.id?.slice(0, 8),
        order_id: p.order_id?.slice(0, 8) ?? 'NULL',
        work_order_id: p.work_order_id?.slice(0, 8) ?? 'NULL',
        stage: p.stage,
        status: p.status,
      });
    }
  }

  console.log('\n=== 3. Standalone work orders (order_id IS NULL) ===');
  const { data: standalone, error: saErr } = await supabase
    .from('work_orders')
    .select('id, work_order_number, order_id')
    .is('order_id', null)
    .order('created_at', { ascending: false })
    .limit(3);
  if (saErr) console.error('Error:', saErr.message);
  else if (!standalone?.length) {
    console.log('⚠️  No standalone work orders (all have order_id set)');
  } else {
    console.log('Found standalone WOs:', standalone.length);
    for (const wo of standalone) {
      console.log(wo.work_order_number, '→ order_id:', wo.order_id);
    }

    // Try inserting a test progress row
    const wo = standalone[0];
    console.log(
      '\n=== 4. Test insert to order_progress with work_order_id ===',
    );
    const insertData = {
      work_order_id: wo.id,
      order_id: null,
      stage: 'weaving',
      status: 'pending',
    };
    console.log('Inserting:', insertData);
    const { data: inserted, error: insErr } = await supabase
      .from('order_progress')
      .insert(insertData)
      .select()
      .single();
    if (insErr) {
      console.error(
        '❌ Insert failed:',
        insErr.message,
        insErr.details,
        insErr.hint,
      );
    } else {
      console.log('✅ Insert OK:', inserted);
    }
  }
}

debug().catch((e) => console.error('Fatal:', e.message));
