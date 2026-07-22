// One-off: create dealer_reviews + listing_reports and add the
// finance_preapproval lead type. All additive & safe to re-run.
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
  `CREATE TABLE IF NOT EXISTS dealer_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dealer_id uuid NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    author_name varchar(120),
    rating integer NOT NULL,
    title varchar(160),
    body text,
    status varchar(16) NOT NULL DEFAULT 'published',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS dealer_reviews_dealer_idx ON dealer_reviews (dealer_id)`,
  `CREATE TABLE IF NOT EXISTS listing_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    reporter_id uuid REFERENCES users(id) ON DELETE SET NULL,
    reason varchar(64) NOT NULL,
    details text,
    reporter_email varchar(200),
    status varchar(16) NOT NULL DEFAULT 'open',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS listing_reports_status_idx ON listing_reports (status)`,
  `ALTER TYPE lead_type ADD VALUE IF NOT EXISTS 'finance_preapproval'`,
];

try {
  for (const sql of statements) {
    try {
      await pool.query(sql);
    } catch (e) {
      // ADD VALUE can't run twice in some PG versions; ignore "already exists".
      if (!/already exists/i.test(e.message)) throw e;
    }
  }
  const { rows } = await pool.query(
    `SELECT to_regclass('public.dealer_reviews') AS reviews,
            to_regclass('public.listing_reports') AS reports`,
  );
  console.log("trust tables ready:", rows[0]);
} finally {
  await pool.end();
}
