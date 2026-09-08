import fs from "node:fs";
import path from "node:path";

/**
 * Creates and destroys real Clerk users so the suite can prove isolation
 * between two ACTUAL signed-in accounts, rather than asserting it about a
 * session that doesn't exist.
 *
 * Every user is created with a `e2e+<runId>@` address and removed in teardown,
 * so a failed run leaves at most a handful of clearly-labelled accounts rather
 * than polluting the real user list.
 */

function secretKey(): string {
  // The suite runs outside Next's env loading, so read .env directly.
  const envPath = path.join(process.cwd(), ".env");
  const raw = fs.readFileSync(envPath, "utf8");
  const key = raw.match(/^CLERK_SECRET_KEY\s*=\s*"?([^"\r\n]+)"?/m)?.[1];
  if (!key) throw new Error("CLERK_SECRET_KEY missing from .env");
  return key;
}

const API = "https://api.clerk.com/v1";

async function clerk(pathname: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(
      `Clerk ${init.method ?? "GET"} ${pathname} -> ${res.status}: ${text.slice(0, 400)}`,
    );
  }
  return body;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

/**
 * A long random password satisfying any reasonable policy, and one that a
 * breach-check cannot flag as compromised.
 */
function makePassword(): string {
  return `E2e!${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)
    .toUpperCase()}#7`;
}

export async function createTestUser(label: string): Promise<TestUser> {
  // Clerk reserves "+clerk_test" addresses for automated testing: they skip
  // real delivery and always accept the fixed code 424242. This instance
  // requires new-device email verification, and using the reserved address is
  // the supported way through it — rather than turning that protection off.
  const email = `e2e_${label}_${Date.now()}+clerk_test@example.com`;
  const password = makePassword();

  const user = await clerk("/users", {
    method: "POST",
    body: JSON.stringify({
      email_address: [email],
      password,
      first_name: "E2E",
      last_name: label,
      skip_password_checks: true,
    }),
  });

  return { id: user.id, email, password };
}

export async function deleteTestUser(id: string): Promise<void> {
  try {
    await clerk(`/users/${id}`, { method: "DELETE" });
  } catch {
    // Teardown must never fail the run; a stray e2e_ user is visible and cheap.
  }
}

/** Removes any e2e_ users left behind by an interrupted run. */
export async function cleanupStrayTestUsers(): Promise<number> {
  const users = await clerk("/users?limit=100");
  const stray = (Array.isArray(users) ? users : []).filter((u: unknown) => {
    const rec = u as { email_addresses?: Array<{ email_address?: string }> };
    return rec.email_addresses?.some((e) =>
      e.email_address?.startsWith("e2e_"),
    );
  });
  for (const u of stray) await deleteTestUser((u as { id: string }).id);
  return stray.length;
}
