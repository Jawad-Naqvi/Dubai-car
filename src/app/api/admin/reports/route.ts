import { NextResponse } from "next/server";
import { isAdminAllowed } from "@/lib/data/users";
import { listReports, updateReportStatus } from "@/lib/data/reports";

export const runtime = "nodejs";

/** GET /api/admin/reports?status= → report queue. */
export async function GET(req: Request) {
  if (!(await isAdminAllowed())) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  return NextResponse.json({ reports: await listReports(status) });
}

/** PATCH /api/admin/reports  { id, status } → action a report. */
export async function PATCH(req: Request) {
  if (!(await isAdminAllowed())) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  await updateReportStatus(String(body.id), String(body.status));
  return NextResponse.json({ ok: true, reports: await listReports() });
}
