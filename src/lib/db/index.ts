import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { Pool } from "pg";
import { neon } from "@neondatabase/serverless";
import dns from "node:dns";
import * as schema from "./schema";

// Prefer IPv4 — avoids intermittent ENOTFOUND on networks with flaky IPv6.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* older node */
}

// All call sites use the standard drizzle query builder, so both drivers expose
// the same surface. We type against the node-postgres db and cast the Neon one.
type DB = NodePgDatabase<typeof schema>;

/**
 * Database driver, chosen by connection string:
 *
 *  - **Neon** (`*.neon.tech`) → the Neon serverless **HTTP** driver. Each query
 *    is a single stateless HTTPS request, so there is no long-lived TCP socket
 *    to be dropped ("Connection terminated unexpectedly") and a suspended Neon
 *    compute is woken gracefully instead of timing out. Safe here because the
 *    app uses no interactive transactions.
 *  - **Any other Postgres** (RDS / Aurora / Supabase / local) → standard
 *    node-postgres pool. Migrating providers changes only DATABASE_URL in
 *    `.env`; no application code changes are required.
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

  // ---- Neon: HTTP driver (resilient over slow/flaky networks, cold starts) ----
  if (url.includes("neon.tech")) {
    const sql = neon(url);
    cached = drizzleNeon(sql, { schema }) as unknown as DB;
    return cached;
  }

  // ---- Other Postgres: node-postgres pool ----
  // Managed Postgres (RDS, Aurora, Supabase) requires TLS; a local dev Postgres
  // (sslmode=disable / localhost) does not.
  const needsSsl =
    url.includes("sslmode=require") ||
    url.includes("rds.amazonaws.com") ||
    url.includes("supabase");

  cachedPool = new Pool({
    connectionString: url,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    keepAlive: true,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  });
  // Don't let an idle-client error crash the process.
  cachedPool.on("error", (err) => {
    console.error("pg pool error (non-fatal):", err.message);
  });
  cached = drizzlePg(cachedPool, { schema });
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
