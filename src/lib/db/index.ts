import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dns from "node:dns";
import * as schema from "./schema";

// Prefer IPv4 — avoids intermittent ENOTFOUND on networks with flaky IPv6.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* older node */
}

type DB = NodePgDatabase<typeof schema>;

/**
 * Standard node-postgres driver — works with ANY PostgreSQL provider (Neon
 * today, AWS RDS / Aurora later). Migrating providers changes only DATABASE_URL
 * in `.env`; no application code changes are required.
 */
let cachedPool: Pool | null = null;
let cached: DB | null = null;

function getDb(): DB {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add your Postgres connection string to .env.",
    );
  }
  // Managed Postgres (Neon, RDS, Aurora, Supabase) requires TLS; a local dev
  // Postgres (sslmode=disable / localhost) does not.
  const needsSsl =
    url.includes("sslmode=require") ||
    url.includes("neon.tech") ||
    url.includes("rds.amazonaws.com") ||
    url.includes("supabase");

  cachedPool = new Pool({
    connectionString: url,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    keepAlive: true,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
  // Don't let an idle-client error crash the process.
  cachedPool.on("error", (err) => {
    console.error("pg pool error (non-fatal):", err.message);
  });
  cached = drizzle(cachedPool, { schema });
  return cached;
}

// Lazy proxy so `db.select(...)` works without opening a connection at import
// time (which would break the build / demo mode that have no DATABASE_URL).
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function"
      ? (value as (...a: unknown[]) => unknown).bind(real)
      : value;
  },
});

export * from "./schema";
