import { SignUp } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { AuthShell, clerkAuthAppearance } from "@/components/auth/auth-shell";
import { RoleChoiceCards } from "@/components/auth/role-choice-cards";

const ROLE_REDIRECT: Record<string, string> = {
  // Both account types complete identity verification right after signup:
  //  - Individual → Emirates ID verification (required before selling)
  //  - Dealer     → Emirates ID + trade license onboarding
  // (Legacy "buyer"/"seller" aliases kept so old links keep working.)
  individual: "/verify-identity",
  dealer: "/sell/become-seller",
  buyer: "/verify-identity",
  seller: "/sell/become-seller",
};

export default async function SignUpPage({
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const redirectUrl = role ? ROLE_REDIRECT[role] : undefined;

  return (
    <AuthShell
      eyebrow="Start your journey"
      quoteLines={["Buy. Sell.", "Export.", "One Place."]}
      quoteSub="Join Dubai's yard-forward marketplace — buyers, dealers, and importers on a single platform."
      title="Create Account"
      subtitle={
        redirectUrl
          ? "A few details and you're on the road"
          : "First, tell us why you're here"
      }
      footer={
        <span>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-bold text-[#141414] hover:text-[#6B21A8] transition-colors"
          >
            Sign In
          </Link>
        </span>
      }
    >
      {redirectUrl ? (
        <SignUp appearance={clerkAuthAppearance} forceRedirectUrl={redirectUrl} />
      ) : (
        <RoleChoiceCards />
      )}
    </AuthShell>
  );
}
