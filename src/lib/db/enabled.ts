/**
 * Single source of truth for whether a real Postgres connection is configured.
 * The build-verification stub points DATABASE_URL at localhost/stub, so we treat
 * that (and a missing URL) as "DB off" and let the data layer fall back to mock
 * data — the app stays fully renderable before Neon is wired.
 */
export function isDbEnabled(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) return false;
  if (url.includes("stub")) return false;
  if (url.includes("localhost") || url.includes("127.0.0.1")) return false;
  return url.startsWith("postgres");
}
