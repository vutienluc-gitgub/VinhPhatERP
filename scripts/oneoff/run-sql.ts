import { createClient } from '@supabase/supabase-js';

const _supabase = createClient(
  'https://sxphijrofljxkccdwtub.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cGhpanJvZmxqeGtjY2R3dHViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwOTU1OSwiZXhwIjoyMDkwMDg1NTU5fQ.DKems71L40cRKbHqQTxVWKSXgdYkBR525DWuX4ARyaU',
);

async function run() {
  // Wait, Supabase client cannot run DDL. I need to use 'postgres' connection.
  // eslint-disable-next-line no-console
  console.log('Use postgres connection instead');
}

run();
