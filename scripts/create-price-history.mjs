// One-off: price_history table + previous_price/price_updated_at columns.
// Additive & safe to re-run.
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
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS previous_price bigint`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_updated_at timestamp`,
  `CREATE TABLE IF NOT EXISTS price_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    old_price bigint NOT NULL,
    new_price bigint NOT NULL,
    changed_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS price_history_listing_idx ON price_history (listing_id)`,
  `CREATE INDEX IF NOT EXISTS price_history_changed_idx ON price_history (changed_at)`,
];

try {
  for (const sql of statements) await pool.query(sql);
  const { rows } = await pool.query(
    `SELECT to_regclass('public.price_history') AS tbl`,
  );
  console.log("price_history ready:", rows[0].tbl);
} finally {
  await pool.end();
}
