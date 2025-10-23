// test-db.js
import pkg from "pg";
const { Client } = pkg;

const connectionString = "postgresql://postgres:SabbathIsHolyR3st@db.rhebmwmxtiyuazljugfl.supabase.co:5432/postgres?sslmode=require";

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
});

(async () => {
  try {
    console.log("🟡 Connecting to Supabase database...");
    await client.connect();
    console.log("✅ Connection successful!");

    const result = await client.query("SELECT NOW();");
    console.log("🕒 Current DB Time:", result.rows[0]);

  } catch (err) {
    console.error("❌ Connection failed:", err);
  } finally {
    await client.end();
  }
})();
