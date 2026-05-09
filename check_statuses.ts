import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    const statuses = await sql`
      SELECT status, COUNT(*) as count 
      FROM finished_fabric_rolls 
      GROUP BY status
    `;
    console.log('Roll statuses:', statuses);
  } catch (error) {
    console.error(error);
  } finally {
    await sql.end();
  }
}

main();
