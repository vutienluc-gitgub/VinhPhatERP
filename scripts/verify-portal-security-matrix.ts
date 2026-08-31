import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  console.log('\n========================================================');
  console.log('  PORTAL SECURITY MATRIX & NEGATIVE AUTHORIZATION SUITE');
  console.log('========================================================\n');

  // 1. Fetch 2 customer profiles
  const customers = await sql`
    SELECT p.id, p.full_name, p.role, p.customer_id, c.name as customer_name, c.email
    FROM profiles p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.role = 'customer'
    LIMIT 2;
  `;

  if (customers.length < 2) {
    console.log(
      'Need at least 2 customer profiles to test cross-customer isolation.',
    );
    console.log('Found customers:', customers);
    await sql.end();
    return;
  }

  const customerA = customers[0];
  const customerB = customers[1];

  console.log(`[Target Profiles]`);
  console.log(
    `• Customer A: ${customerA.full_name} (${customerA.customer_name}) | customer_id: ${customerA.customer_id}`,
  );
  console.log(
    `• Customer B: ${customerB.full_name} (${customerB.customer_name}) | customer_id: ${customerB.customer_id}\n`,
  );

  // Helper to run query in transaction with simulated auth.uid()
  async function runAsUser<T>(
    userId: string,
    queryFn: (txn: postgres.Sql) => Promise<T>,
  ): Promise<T> {
    return sql.begin(async (txn) => {
      await txn`SET LOCAL ROLE authenticated;`;
      await txn`SELECT set_config('request.jwt.claims', json_build_object('sub', ${userId}::text, 'role', 'authenticated')::text, true);`;
      return queryFn(txn);
    });
  }

  // ── TEST 1: Customer A calls SELECT orders without any customer_id filter ──
  console.log(
    '--- TEST 1: Raw SELECT orders for Customer A (No WHERE customer_id filter) ---',
  );
  const ordersA = await runAsUser(customerA.id, async (txn) => {
    return txn`SELECT id, order_number, customer_id, total_amount FROM orders;`;
  });

  console.log(`Returned ${ordersA.length} order(s).`);
  const foreignOrders = ordersA.filter(
    (o) => o.customer_id !== customerA.customer_id,
  );
  if (foreignOrders.length > 0) {
    console.error(
      `[FAIL] SECURITY VIOLATION: Customer A received ${foreignOrders.length} order(s) of other customers!`,
    );
    process.exit(1);
  } else {
    console.log(
      `[PASS] 100% of returned orders belong strictly to Customer A (${customerA.customer_id}). Zero leakage!`,
    );
  }

  // ── TEST 2: Customer A calls SELECT quotations without filter ──
  console.log(
    '\n--- TEST 2: Raw SELECT quotations for Customer A (No WHERE filter) ---',
  );
  const quotationsA = await runAsUser(customerA.id, async (txn) => {
    return txn`SELECT id, quotation_number, customer_id, status FROM quotations;`;
  });

  console.log(`Returned ${quotationsA.length} quotation(s).`);
  const foreignQuotations = quotationsA.filter(
    (q) => q.customer_id !== customerA.customer_id,
  );
  const draftQuotations = quotationsA.filter((q) => q.status === 'draft');
  if (foreignQuotations.length > 0) {
    console.error(
      `[FAIL] SECURITY VIOLATION: Customer A received ${foreignQuotations.length} quotation(s) of other customers!`,
    );
    process.exit(1);
  } else if (draftQuotations.length > 0) {
    console.error(
      `[FAIL] SECURITY VIOLATION: Customer A received draft quotation(s)!`,
    );
    process.exit(1);
  } else {
    console.log(
      `[PASS] Quotations strictly scoped to Customer A with zero draft leakage!`,
    );
  }

  // ── TEST 3: Customer A calls SELECT shipments without filter ──
  console.log(
    '\n--- TEST 3: Raw SELECT shipments for Customer A (No WHERE filter) ---',
  );
  const shipmentsA = await runAsUser(customerA.id, async (txn) => {
    return txn`SELECT id, shipment_number, customer_id FROM shipments;`;
  });

  console.log(`Returned ${shipmentsA.length} shipment(s).`);
  const foreignShipments = shipmentsA.filter(
    (s) => s.customer_id !== customerA.customer_id,
  );
  if (foreignShipments.length > 0) {
    console.error(
      `[FAIL] SECURITY VIOLATION: Customer A received ${foreignShipments.length} shipment(s) of other customers!`,
    );
    process.exit(1);
  } else {
    console.log(`[PASS] Shipments strictly scoped to Customer A!`);
  }

  // ── TEST 4: NEGATIVE TEST - Customer A attempts to fetch Customer B's order by exact UUID ──
  console.log(
    '\n--- TEST 4 (NEGATIVE AUTHORIZATION): Hostile Access to Customer B Order ---',
  );
  const [orderB] = await sql`
    SELECT id, order_number FROM orders WHERE customer_id = ${customerB.customer_id} LIMIT 1;
  `;

  if (orderB) {
    const hostileOrders = await runAsUser(customerA.id, async (txn) => {
      return txn`SELECT id, order_number FROM orders WHERE id = ${orderB.id};`;
    });

    if (hostileOrders.length > 0) {
      console.error(
        `[FAIL] SECURITY VIOLATION: Customer A was able to read Order B (${orderB.id})!`,
      );
      process.exit(1);
    } else {
      console.log(`Target Order B ID: ${orderB.id}`);
      console.log(
        `Customer A direct SELECT WHERE id = '${orderB.id}' -> Result: 0 rows (DENIED)`,
      );
      console.log(
        `[PASS] Cross-customer tampering completely blocked at PostgreSQL RLS layer!`,
      );
    }
  }

  // ── TEST 5: Direct Predicate Check ──
  console.log('\n--- TEST 5: Direct Predicate Evaluation ---');
  if (orderB) {
    const [{ allowed: allowedA }] = await sql`
      SELECT public.fn_can_access_order(${orderB.id}, ${customerA.id}) AS allowed;
    `;
    const [{ allowed: allowedB }] = await sql`
      SELECT public.fn_can_access_order(${orderB.id}, ${customerB.id}) AS allowed;
    `;
    console.log(
      `• Customer A access to Order B: ${allowedA ? '[FAIL] ALLOWED (Violation)' : '[PASS] DENIED (Correct)'}`,
    );
    console.log(
      `• Customer B access to Order B: ${allowedB ? '[PASS] ALLOWED (Correct)' : '[FAIL] DENIED (Violation)'}`,
    );
    if (allowedA || !allowedB) {
      console.error('Predicate validation failed!');
      process.exit(1);
    }
  }

  console.log('\n======================================================');
  console.log('ALL SECURITY MATRIX TESTS PASSED (100% ISOLATION)');
  console.log('======================================================\n');
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
