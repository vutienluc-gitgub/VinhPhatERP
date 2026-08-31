import * as fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/audit_output.json', 'utf-8'));

interface Policy {
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

const relevantTables = [
  'orders',
  'order_items',
  'shipments',
  'shipment_items',
  'quotations',
  'quotation_items',
  'payments',
  'contracts',
  'order_requests',
  'customers',
  'suppliers',
  'profiles',
  'chat_rooms',
  'chat_messages',
  'chat_room_participants',
  'app_notifications',
];

console.log('=== AUDIT FINDINGS: RELEVANT TABLES POLICIES ===');
for (const table of relevantTables) {
  const tablePolicies = (raw.policies as Policy[]).filter(
    (p) => p.tablename === table,
  );
  console.log(`\nTABLE: ${table} (Policies: ${tablePolicies.length})`);
  for (const pol of tablePolicies) {
    console.log(
      `  - [${pol.cmd}] "${pol.policyname}" | Roles: ${pol.roles?.join(', ')} | Permissive: ${pol.permissive}`,
    );
    if (pol.qual) console.log(`      USING: ${pol.qual}`);
    if (pol.with_check) console.log(`      WITH CHECK: ${pol.with_check}`);
  }
}

console.log('\n=== POLICIES WITH OVERPERMISSIVE "true" ===');
const overpermissive = (raw.policies as Policy[]).filter(
  (p) =>
    (p.qual === 'true' ||
      p.with_check === 'true' ||
      p.qual?.includes('true')) &&
    relevantTables.includes(p.tablename),
);
for (const pol of overpermissive) {
  console.log(`  - ${pol.tablename} -> "${pol.policyname}" (${pol.cmd})`);
}
