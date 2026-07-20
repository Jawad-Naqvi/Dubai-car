import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { AuthShell, clerkAuthAppearance } from "@/components/auth/auth-shell";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AuthShell
      eyebrow="Start your journey"
      quoteLines={["Buy. Sell.", "Export.", "One Place."]}
      quoteSub="Join Dubai's yard-forward marketplace — buyers, dealers, and importers on a single platform."
      title="Create Account"
      subtitle="A few details and you're on the road"
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
      <SignUp appearance={clerkAuthAppearance} />
    </AuthShell>
  );
}
