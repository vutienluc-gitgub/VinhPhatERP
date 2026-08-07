import crypto from 'crypto';

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if .env.local doesn't exist

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Require Service Role Key to bypass RLS when creating mock data
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRaceCondition() {
  console.log('\n🏎️  Testing Race Condition on rpc_allocate_rolls...\n');

  // 1. Create a fake roll for testing (we need a valid raw_fabric_roll_id)
  const fakeRollId = crypto.randomUUID();
  const rollNumber = 'RACE-TEST-' + Date.now();

  // Note: Since raw_fabric_roll_id is a foreign key in roll_allocations,
  // we actually need a real roll in raw_fabric_rolls to test the DB constraint,
  // OR we can just test if the RPC prevents duplicate inserts for ANY string if the FK constraint isn't checked immediately,
  // but let's insert a fake roll first.

  const { data: rollData, error: rollError } = await supabase
    .from('raw_fabric_rolls')
    .insert({
      id: fakeRollId,
      roll_number: rollNumber,
      fabric_type: 'Test',
      weight_kg: 10,
    })
    .select('id')
    .single();

  let actualRollId = fakeRollId;

  if (rollError) {
    console.log('⚠️ Could not insert fake roll:', rollError);
    const { data: existingRolls } = await supabase
      .from('raw_fabric_rolls')
      .select('id')
      .limit(1);
    if (!existingRolls || existingRolls.length === 0) {
      console.error('❌ No rolls available in DB to test race condition.');
      return;
    }
    actualRollId = existingRolls[0].id;

    // Cleanup any existing allocations for this roll just for the test
    await supabase
      .from('roll_allocations')
      .delete()
      .eq('roll_id', actualRollId);
  } else {
    actualRollId = rollData.id;
  }

  console.log(`🎯 Target Roll ID: ${actualRollId}`);

  // 2. Fire 10 concurrent allocation requests
  const CONCURRENT_REQUESTS = 10;
  console.log(
    `🚀 Firing ${CONCURRENT_REQUESTS} concurrent allocation requests...`,
  );

  const targetId = 'test-target-' + Date.now();

  const promises = Array.from({ length: CONCURRENT_REQUESTS }).map((_, _i) => {
    return supabase.rpc('rpc_allocate_rolls', {
      p_roll_ids: [actualRollId],
      p_target_type: 'dyeing_order',
      p_target_id: targetId,
    });
  });

  const results = await Promise.allSettled(promises);

  // 3. Analyze results
  let successCount = 0;
  let failCount = 0;

  for (const res of results) {
    if (res.status === 'fulfilled' && !res.value.error) {
      successCount++;
    } else {
      failCount++;
      // console.log(res.status === 'fulfilled' ? res.value.error : res.reason);
    }
  }

  console.log('\n📊 Results:');
  console.log(`✅ Successes (Expected 1): ${successCount}`);
  console.log(
    `❌ Failures (Expected ${CONCURRENT_REQUESTS - 1}): ${failCount}`,
  );

  if (successCount === 1 && failCount === CONCURRENT_REQUESTS - 1) {
    console.log(
      '\n🎉 RACE CONDITION PREVENTED SUCCESSFULLY! (Pessimistic Locking Works)',
    );
  } else {
    console.error(
      '\n💥 RACE CONDITION FAILED! Multiple processes managed to allocate the same roll.',
    );
    process.exit(1);
  }

  // 4. Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('roll_allocations').delete().eq('target_id', targetId);
  if (actualRollId === fakeRollId) {
    await supabase.from('raw_fabric_rolls').delete().eq('id', fakeRollId);
  }
}

testRaceCondition().catch(console.error);
