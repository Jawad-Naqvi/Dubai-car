// India demo: adds dealers.country_code (additive) and seeds 3 India sample
// cars as private listings (country_code='IN'). Safe & idempotent (ON CONFLICT).
// These appear ONLY in the India market (scoped out of UAE browse). Remove with:
//   DELETE FROM listings WHERE slug LIKE 'in-demo-%';
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
const pool = new Pool({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : undefined });

// Prices are in INR (the column is named price_aed but holds each listing's
// own market currency; the India market formats it as ₹).
const CARS = [
  ["in-demo-2022-maruti-suzuki-swift-zxi", "Maruti Suzuki", "Swift", "ZXi", 2022, 24000, 750000, "Hatchback", "Petrol", "Automatic", "Red", "Mumbai", "Single owner, full service history, excellent condition."],
  ["in-demo-2021-hyundai-creta-sx", "Hyundai", "Creta", "SX", 2021, 38000, 1350000, "SUV", "Diesel", "Automatic", "White", "Bangalore", "Top variant, sunroof, well maintained."],
  ["in-demo-2023-tata-nexon-xz", "Tata", "Nexon", "XZ+", 2023, 15000, 1120000, "SUV", "Petrol", "Manual", "Blue", "Delhi NCR", "Like new, 5-star safety, company-fitted accessories."],
];

try {
  await pool.query(
    `ALTER TABLE dealers ADD COLUMN IF NOT EXISTS country_code varchar(2) NOT NULL DEFAULT 'AE'`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS dealers_country_idx ON dealers (country_code)`,
  );

  let inserted = 0;
  for (const c of CARS) {
    const res = await pool.query(
      `INSERT INTO listings
        (slug, make, model, trim, year, kms, price_aed, body_type, fuel, transmission,
         color_exterior, emirate, country_code, status, condition, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'IN','active','Used',$13)
       ON CONFLICT (slug) DO NOTHING`,
      c,
    );
    inserted += res.rowCount;
  }
  const { rows } = await pool.query(
    `SELECT country_code, count(*)::int n FROM listings GROUP BY country_code ORDER BY country_code`,
  );
  console.log(`India demo cars inserted this run: ${inserted}`);
  console.log("listings by market:", rows);
} finally {
  await pool.end();
}
