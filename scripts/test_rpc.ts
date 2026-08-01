import { untypedDb } from '@/services/supabase/client';

async function test() {
  const { data, error } = await untypedDb.rpc('rpc_get_public_po_details', {
    p_token: '00000000-0000-0000-0000-000000000000',
  });
  console.log('Result:', { data, error });
}

test();
