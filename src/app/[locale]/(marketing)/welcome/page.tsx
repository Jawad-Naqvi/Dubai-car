import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AccountTypePicker } from "@/components/onboarding/account-type-picker";
import { getOnboardingState } from "@/lib/data/onboarding";

export const dynamic = "force-dynamic";

/**
 * Onboarding step one. Reached from /post-auth the first time someone signs
 * in, so the account-type question is asked once, after the account exists —
 * not as a fork in the sign-up URL that a returning user can land on by
 * accident.
 */
export default async function WelcomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const state = await getOnboardingState();

  if (!state) redirect(`/${locale}/sign-in`);
  // Already chosen — don't ask again.
  if (!state.needsTypeChoice) redirect(`/${locale}/post-auth`);

  const firstName = state.user.name?.split(" ")[0];

  return (
    <AuthShell
      eyebrow="Welcome"
      quoteLines={["Buy. Sell.", "Ship.", "One account."]}
      quoteSub="One login for buyers, dealers and our freight partners. What you can do depends on your account, not on a different door."
      title={firstName ? `Welcome, ${firstName}` : "Welcome"}
      subtitle="What brings you here? You can change this later."
    >
      <AccountTypePicker locale={locale} />
    </AuthShell>
  );
}
