import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
);

async function check() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log(
    'Buckets:',
    data?.map((b) => b.name),
  );
  console.log('Error:', error);

  if (!data?.find((b) => b.name === 'public-media')) {
    const r1 = await supabase.storage.createBucket('public-media', {
      public: true,
    });
    console.log('Created public-media:', r1);
  }
  if (!data?.find((b) => b.name === 'secure-media')) {
    const r2 = await supabase.storage.createBucket('secure-media', {
      public: false,
    });
    console.log('Created secure-media:', r2);
  }
}

check();
