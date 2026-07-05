/**
 * Runs once when the server starts. Neon (and most cloud DBs) resolve to both
 * IPv4 and IPv6; if the host network's IPv6 path is flaky, Node can intermittently
 * fail DNS with ENOTFOUND. Forcing IPv4-first makes DB connections reliable.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
