import { untypedDb as db } from '@/services/supabase/untyped';

async function testRpc() {
  const { data, error } = await db.rpc('next_weaving_invoice_number');
  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success:', data);
  }
}

testRpc();
