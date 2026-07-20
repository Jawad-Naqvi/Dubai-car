// One-off: listing_inspections table (dealer/admin-submitted inspection reports).
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
  `CREATE TABLE IF NOT EXISTS listing_inspections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    inspector_name varchar(160) NOT NULL,
    inspected_at timestamp NOT NULL DEFAULT now(),
    categories jsonb NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS listing_inspections_listing_idx ON listing_inspections (listing_id)`,
];

try {
  for (const sql of statements) await pool.query(sql);
  const { rows } = await pool.query(
    `SELECT to_regclass('public.listing_inspections') AS tbl`,
  );
  console.log("listing_inspections ready:", rows[0].tbl);
} finally {
  await pool.end();
}
