import { resolve } from 'path';

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing URL or SERVICE KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error(error);
    return;
  }

  // We can't directly query pg_policies via standard Supabase REST API from client.
  // Wait, we can query using a stored proc if one exists, but we can just use psql via supabse cli.
}

main();
