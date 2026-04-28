import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('--- 3. CHẠY QUERY KIỂM TRA THẬT ---');
  const { data, error } = await supabase.from('profiles').select('id, preferences').not('preferences', 'is', null).limit(1);
  if (error) console.error('Error:', error);
  else console.log('Dữ liệu từ DB:', JSON.stringify(data, null, 2));
}
test();
