import { NextResponse } from "next/server";
import { submitOnboardingDocument } from "@/lib/data/onboarding";
import { getOnboardingState } from "@/lib/data/onboarding";

/** Current KYC requirements + what has been supplied so far. */
export async function GET() {
  const state = await getOnboardingState();
  if (!state) return NextResponse.json({ kyc: null });
  return NextResponse.json({
    orgId: state.primary?.id ?? null,
    orgType: state.primary?.type ?? null,
    status: state.primary?.status ?? null,
    rejectionReason: state.primary?.rejectionReason ?? null,
    kyc: state.kyc,
  });
}

/** Submits one document. Ownership of the org is verified server-side. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.orgId !== "string" || typeof body.docType !== "string") {
    return NextResponse.json({ error: "Missing document details." }, { status: 400 });
  }

  const result = await submitOnboardingDocument({
    orgId: body.orgId,
    docType: body.docType,
    docNumber: typeof body.docNumber === "string" ? body.docNumber : undefined,
    frontMediaId: typeof body.frontMediaId === "string" ? body.frontMediaId : undefined,
    backMediaId: typeof body.backMediaId === "string" ? body.backMediaId : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json({ ok: true, status: result.status });
}
