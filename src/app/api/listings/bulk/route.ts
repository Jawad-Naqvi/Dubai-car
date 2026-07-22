import { NextResponse } from "next/server";
import { createListing } from "@/lib/data/listing-write";
import { getOrSyncUser, getCurrentDealer } from "@/lib/data/users";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_ROWS = 200;

interface RowResult {
  row: number;
  ok: boolean;
  title?: string;
  error?: string;
}

/**
 * POST /api/listings/bulk — dealer bulk inventory import. Requires a signed-in
 * user who owns a dealer record; every created listing is stamped with THAT
 * dealer's id (via createListing, which resolves the dealer from the user),
 * so a bulk import can never create listings under another dealer. Returns a
 * per-row success/error report so the dealer can fix and re-upload bad rows.
 */
export async function POST(req: Request) {
  const user = await getOrSyncUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const dealer = await getCurrentDealer();
  if (!dealer) {
    return NextResponse.json(
      { error: "Bulk upload is for verified dealers. Complete dealer onboarding first." },
      { status: 403 },
    );
  }

  const rl = rateLimit(`listings-bulk:${user.id}:${clientIp(req)}`, 10, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Bulk import limit reached, try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  const rows = Array.isArray(body?.rows) ? body.rows : null;
  if (!rows) return NextResponse.json({ error: "Expected { rows: [...] }" }, { status: 400 });
  if (rows.length === 0) return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS} per import)` },
      { status: 400 },
    );
  }

  const results: RowResult[] = [];
  let created = 0;
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i] ?? {};
    try {
      const res = await createListing(
        {
          make: raw.make,
          model: raw.model,
          trim: raw.trim || undefined,
          year: raw.year,
          kms: raw.kms,
          priceAED: raw.priceAED ?? raw.price,
          bodyType: raw.bodyType || undefined,
          fuel: raw.fuel || undefined,
          transmission: raw.transmission || undefined,
          regionalSpec: raw.regionalSpec || undefined,
          colorExterior: raw.colorExterior || raw.color || undefined,
          emirate: raw.emirate,
          vin: raw.vin || undefined,
          description: raw.description || undefined,
          isExportReady:
            typeof raw.isExportReady === "string"
              ? /^(true|yes|1)$/i.test(raw.isExportReady)
              : !!raw.isExportReady,
        },
        user,
      );
      created++;
      results.push({
        row: i + 1,
        ok: true,
        title: `${raw.year} ${raw.make} ${raw.model}`.trim(),
      });
    } catch (err) {
      results.push({
        row: i + 1,
        ok: false,
        error: err instanceof Error ? err.message : "Invalid row",
      });
    }
  }

  return NextResponse.json({ created, total: rows.length, results });
}
