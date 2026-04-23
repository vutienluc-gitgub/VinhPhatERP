import { createClient } from '@supabase/supabase-js';

const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbXBsZS1wcm9qZWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2NjAwMDB9.dummy');

async function run() {
  const { data, error } = await supabase.from('customers').select('id, code').or('code.eq."KH-014"');
  console.log('With quotes error:', error);
  const { data: d2, error: e2 } = await supabase.from('customers').select('id, code').or('code.eq.KH-014');
  console.log('Without quotes error:', e2);
}
run();
