import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres:admin@127.0.0.1:5432/postgres" });
try {
  const existing = await pool.query("SELECT 1 FROM pg_database WHERE datname = 'mise'");
  if (existing.rows.length === 0) {
    await pool.query("CREATE DATABASE mise");
    console.log("Database 'mise' created");
  } else {
    console.log("Database 'mise' already exists");
  }
} catch (e) {
  console.log("ERROR:", e.message);
} finally {
  await pool.end();
}
