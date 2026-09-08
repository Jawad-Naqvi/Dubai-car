/**
 * Structured logging.
 *
 * Every line is one JSON object, so a log aggregator (Datadog, Axiom, Better
 * Stack, CloudWatch) can index by `level`, `event`, `requestId`, `userId`
 * instead of grepping prose. In development the same records are printed in a
 * readable form.
 *
 * PII is REDACTED by key name before anything is written. The previous
 * behaviour — printing whole email bodies to stdout when SMTP was unconfigured
 * — put buyer names, phone numbers and messages into platform logs, which are
 * retained far longer than the data they describe. Redaction happens here, at
 * the sink, so no call site can forget.
 *
 * Deliberately dependency-free: it runs in route handlers, server components
 * and the edge middleware alike.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

type Ctx = Record<string, unknown>;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Keys whose values are never written, whatever nesting they appear at. */
const REDACT_KEYS = new Set([
  "password",
  "token",
  "tokenhash",
  "secret",
  "authorization",
  "cookie",
  "emiratesidnumber",
  "docnumber",
  "phone",
  "whatsapp",
  "body", // email/message bodies
  "message",
  "cardnumber",
  "iban",
]);

const MAX_DEPTH = 4;

function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return "[depth]";
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Ctx = {};
    for (const [k, v] of Object.entries(value as Ctx)) {
      out[k] = REDACT_KEYS.has(k.toLowerCase()) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  if (typeof value === "string" && value.length > 2000) {
    return `${value.slice(0, 2000)}…[+${value.length - 2000}]`;
  }
  return value;
}

function minLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL ?? "").toLowerCase() as LogLevel;
  if (env in LEVEL_RANK) return env;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function write(level: LogLevel, event: string, ctx?: Ctx) {
  if (LEVEL_RANK[level] < LEVEL_RANK[minLevel()]) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(ctx ? (redact(ctx) as Ctx) : {}),
  };

  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(record)
      : `[${level.toUpperCase()}] ${event}${
          ctx ? " " + JSON.stringify(redact(ctx)) : ""
        }`;

  // console is the sink; platforms capture stdout/stderr per level.
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, ctx?: Ctx) => write("debug", event, ctx),
  info: (event: string, ctx?: Ctx) => write("info", event, ctx),
  warn: (event: string, ctx?: Ctx) => write("warn", event, ctx),
  error: (event: string, ctx?: Ctx) => write("error", event, ctx),
};

/**
 * Correlation id for one request. Honour an upstream id (load balancer, CDN)
 * so a trace survives across hops; mint one otherwise.
 */
export function requestId(req?: Request): string {
  const upstream =
    req?.headers.get("x-request-id") ?? req?.headers.get("x-vercel-id");
  if (upstream) return upstream.slice(0, 64);
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
