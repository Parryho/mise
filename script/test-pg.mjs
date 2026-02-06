import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres:admin@127.0.0.1:5432/postgres" });
try {
  const r = await pool.query("SELECT 1 as ok");
  console.log("PG OK:", r.rows[0]);
} catch (e) {
  console.log("PG ERROR:", e.message);
} finally {
  await pool.end();
}
