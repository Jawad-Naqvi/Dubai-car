import { SignUp } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { AuthShell, clerkAuthAppearance } from "@/components/auth/auth-shell";
import { Car, Building2 } from "lucide-react";

const ROLE_REDIRECT: Record<string, string> = {
  buyer: "/dashboard",
  seller: "/sell/become-seller",
};

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { locale } = await params;
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
            href={`/${locale}/sign-in`}
            className="font-bold text-[#141414] hover:text-[#C97612] transition-colors"
          >
            Sign In
          </Link>
        </span>
      }
    >
      {redirectUrl ? (
        <SignUp appearance={clerkAuthAppearance} forceRedirectUrl={redirectUrl} />
      ) : (
        <div className="flex flex-col gap-3">
          <Link
            href="/sign-up?role=buyer"
            className="group flex items-center gap-3.5 rounded-2xl border border-[#E7E4DA] bg-white px-4 py-4 hover:border-[#141414]/30 hover:shadow-card transition-all"
          >
            <span className="h-11 w-11 rounded-xl bg-[#F3F1E9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#141414] transition-colors">
              <Car className="h-5 w-5 text-[#F0941F] group-hover:text-white transition-colors" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-bold text-[#141414]">
                I&apos;m buying a car
              </span>
              <span className="block text-xs text-secondary mt-0.5">
                Browse listings, save searches, contact sellers
              </span>
            </span>
          </Link>
          <Link
            href="/sign-up?role=seller"
            className="group flex items-center gap-3.5 rounded-2xl border border-[#E7E4DA] bg-white px-4 py-4 hover:border-[#141414]/30 hover:shadow-card transition-all"
          >
            <span className="h-11 w-11 rounded-xl bg-[#F3F1E9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#141414] transition-colors">
              <Building2 className="h-5 w-5 text-[#F0941F] group-hover:text-white transition-colors" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-bold text-[#141414]">
                I&apos;m selling as a dealer
              </span>
              <span className="block text-xs text-secondary mt-0.5">
                List inventory — verification required before going live
              </span>
            </span>
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
