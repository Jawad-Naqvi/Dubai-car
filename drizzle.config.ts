import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Prefer the direct (non-pooled) connection for schema migrations; fall
    // back to the pooled URL. Both point at the same database.
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
