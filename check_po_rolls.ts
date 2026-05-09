import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    const orders =
      await sql`SELECT id, order_number, status FROM orders WHERE order_number = 'PO-20260420-3583'`;
    console.log('Orders:', orders);

    if (orders.length > 0) {
      console.log(
        'Checking finished_fabric_rolls for reserved_for_order_id =',
        orders[0].id,
      );
      const rolls =
        await sql`SELECT id, status, lot_number, roll_number FROM finished_fabric_rolls WHERE reserved_for_order_id = ${orders[0].id}`;
      console.log('Rolls count:', rolls.length);
      console.log(
        'Roll statuses:',
        rolls.reduce((acc, roll) => {
          acc[roll.status] = (acc[roll.status] || 0) + 1;
          return acc;
        }, {}),
      );

      const readyRolls = rolls.filter(
        (r) =>
          r.status === 'in_stock' ||
          r.status === 'ready' ||
          r.status === 'quality_passed',
      );
      console.log('Ready Rolls:', readyRolls.length);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await sql.end();
  }
}

main();
