// One-off: compare_listings table (cross-device compare tray). Safe to re-run.
import { Pool } from "pg";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const pick = (k) => {
  const line = env.split(/\r?\n/).find((l) => l.startsWith(k + "="));
  return line?.slice(k.length + 1).trim().replace(/^["']|["']$/g, "");
};
const url = pick("DIRECT_DATABASE_URL") || pick("DATABASE_URL");
if (!url) throw new Error("DATABASE_URL not found in .env");

const needsSsl = /neon\.tech|rds\.amazonaws\.com|supabase|sslmode=require/.test(url);
const pool = new Pool({
  connectionString: url,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS compare_listings (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id)
  )`,
];

try {
  for (const sql of statements) await pool.query(sql);
  const { rows } = await pool.query(
    `SELECT to_regclass('public.compare_listings') AS tbl`,
  );
  console.log("compare_listings ready:", rows[0].tbl);
} finally {
  await pool.end();
}
