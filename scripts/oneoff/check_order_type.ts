import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    const orders =
      await sql`SELECT order_type FROM orders WHERE order_number = 'PO-20260420-3583'`;
    console.log('Order Type:', orders);
  } catch (error) {
    console.error(error);
  } finally {
    await sql.end();
  }
}

main();
