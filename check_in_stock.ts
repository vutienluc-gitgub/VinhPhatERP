import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    const inStock = await sql`
      SELECT id, status, fabric_type, color_name, reserved_for_order_id 
      FROM finished_fabric_rolls 
      WHERE status = 'in_stock'
      LIMIT 10
    `;
    console.log('In Stock count:', inStock.length);
    console.log(inStock);

    // Also check total in_stock count
    const [{ count }] =
      await sql`SELECT COUNT(*) FROM finished_fabric_rolls WHERE status = 'in_stock'`;
    console.log('Total in_stock:', count);
  } catch (error) {
    console.error(error);
  } finally {
    await sql.end();
  }
}

main();
