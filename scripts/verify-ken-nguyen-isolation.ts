import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  console.log('\n--- VERIFYING KEN NGUYEN ISOLATION ---');

  const [ken] = await sql`
    SELECT p.id, p.full_name, p.role, p.customer_id, c.name as customer_name
    FROM profiles p
    LEFT JOIN customers c ON c.id = p.customer_id
    WHERE p.full_name ILIKE '%Ken%'
    LIMIT 1;
  `;

  if (!ken) {
    console.log('Ken Nguyen profile not found.');
    await sql.end();
    return;
  }

  console.log(`Ken Profile ID: ${ken.id}, Customer ID: ${ken.customer_id}`);

  // Query orders as Ken Nguyen via RLS
  const orders = await sql.begin(async (txn) => {
    await txn`SET LOCAL ROLE authenticated;`;
    await txn`SELECT set_config('request.jwt.claims', json_build_object('sub', ${ken.id}::text, 'role', 'authenticated')::text, true);`;
    return txn`SELECT id, order_number, customer_id, total_amount, paid_amount FROM orders;`;
  });

  console.log(
    `Orders visible to Ken Nguyen via RLS: ${orders.length} order(s)`,
  );
  const totalDebt = orders.reduce(
    (sum, o) => sum + (Number(o.total_amount) - Number(o.paid_amount)),
    0,
  );
  console.log(
    `Total remaining debt for Ken Nguyen: ${totalDebt.toLocaleString('vi-VN')} đ`,
  );

  const foreignOrders = orders.filter((o) => o.customer_id !== ken.customer_id);
  if (foreignOrders.length > 0) {
    console.error(
      `[FAIL] Ken Nguyen still sees ${foreignOrders.length} foreign orders!`,
    );
    process.exit(1);
  } else {
    console.log(
      `[PASS] Ken Nguyen sees 0 foreign orders. All ${orders.length} orders belong 100% to Ken Nguyen.`,
    );
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
