// One-off: add listings.country_code (market scoping). Additive, safe to re-run.
// Existing rows backfill to 'AE' via the column default, so UAE browse is unchanged.
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
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS country_code varchar(2) NOT NULL DEFAULT 'AE'`,
  `CREATE INDEX IF NOT EXISTS listings_country_idx ON listings (country_code)`,
];

try {
  for (const sql of statements) await pool.query(sql);
  const { rows } = await pool.query(
    `SELECT country_code, count(*)::int n FROM listings GROUP BY country_code`,
  );
  console.log("listings.country_code ready. Distribution:", rows);
} finally {
  await pool.end();
}
