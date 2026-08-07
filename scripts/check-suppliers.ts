import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cats } = await supabase.from('supplier_categories').select('*');
  console.log('Categories:', cats);

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('name, category, status');
  console.log('Suppliers:', suppliers);
}
check();
