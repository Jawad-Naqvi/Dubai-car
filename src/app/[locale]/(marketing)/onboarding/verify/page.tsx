import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { DocumentStep } from "@/components/onboarding/document-step";
import { getOnboardingState } from "@/lib/data/onboarding";

export const dynamic = "force-dynamic";

/**
 * Onboarding step two — verification documents.
 *
 * The requirement list comes from the country pack for this org's country and
 * party type, so nothing here is UAE-specific in code even though UAE is the
 * only market seeded today.
 */
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const state = await getOnboardingState();

  if (!state) redirect(`/${locale}/sign-in`);
  if (state.needsTypeChoice) redirect(`/${locale}/welcome`);
  if (!state.primary || !state.kyc) redirect(`/${locale}/dashboard`);

  const isForwarder = state.primary.type === "forwarder";
  const continueHref = isForwarder
    ? `/${locale}/dashboard/freight`
    : `/${locale}/dashboard`;

  return (
    <AuthShell
      eyebrow="Verification"
      quoteLines={["Verified", "sellers.", "Real trust."]}
      quoteSub="Every seller and partner on the platform is checked before they can transact. It takes us 1–2 business days."
      title="Verify your account"
      subtitle={
        state.primary.status === "rejected"
          ? "Some documents need an update. Replace them below and we'll re-review."
          : "Upload what you have now — you can add the rest later."
      }
    >
      {state.primary.rejectionReason && (
        <div className="mb-4 rounded-xl border border-[#DC2626]/25 bg-[#DC2626]/5 p-3">
          <p className="text-[11px] text-[#DC2626] leading-relaxed">
            {state.primary.rejectionReason}
          </p>
        </div>
      )}
      <DocumentStep
        orgId={state.primary.id}
        requirements={state.kyc.requirements}
        submitted={state.kyc.submitted}
        continueHref={continueHref}
      />
    </AuthShell>
  );
}
