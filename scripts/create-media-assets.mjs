// One-off: create the media_assets table (additive, safe to re-run).
import { Pool } from "pg";
import { readFileSync } from "node:fs";

// Load DATABASE_URL from .env without extra deps.
const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
const url = line?.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
if (!url) throw new Error("DATABASE_URL not found in .env");

const needsSsl = /neon\.tech|rds\.amazonaws\.com|supabase|sslmode=require/.test(url);
const pool = new Pool({
  connectionString: url,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

const sql = `
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime_type varchar(64) NOT NULL DEFAULT 'image/jpeg',
  size integer NOT NULL DEFAULT 0,
  data bytea NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
`;

try {
  await pool.query(sql);
  const { rows } = await pool.query(
    "SELECT to_regclass('public.media_assets') AS tbl",
  );
  console.log("media_assets ready:", rows[0].tbl);
} finally {
  await pool.end();
}
