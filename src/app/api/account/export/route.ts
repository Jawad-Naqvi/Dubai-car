import { NextResponse } from "next/server";
import { exportMyData } from "@/lib/data/account-data";

export const dynamic = "force-dynamic";

/**
 * Right of access (GDPR Art. 15): everything we hold about the caller, as a
 * downloadable JSON file. Strictly self-scoped — there is no id parameter.
 */
export async function GET() {
  const data = await exportMyData();
  if (!data) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const filename = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
