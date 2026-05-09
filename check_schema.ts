import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'finished_fabric_rolls'
    `;
    console.log(
      'Columns in finished_fabric_rolls:',
      columns.map((c) => c.column_name),
    );

    // Also let's check order items
    const orders =
      await sql`SELECT id, order_number, status FROM orders WHERE order_number = 'PO-20260420-3583'`;
    if (orders.length > 0) {
      console.log('Order Items:');
      const items =
        await sql`SELECT id, fabric_id, quantity, status FROM order_items WHERE order_id = ${orders[0].id}`;
      console.log(items);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await sql.end();
  }
}

main();
