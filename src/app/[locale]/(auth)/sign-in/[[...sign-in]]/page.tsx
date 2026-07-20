import { SignIn } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { ShieldCheck } from "lucide-react";
import { AuthShell, clerkAuthAppearance } from "@/components/auth/auth-shell";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AuthShell
      eyebrow="A wise choice"
      quoteLines={["Drive", "Everything", "You Want"]}
      quoteSub="Verified cars, trusted dealers, and worldwide export. Trust the process — enjoy the drive."
      title="Welcome Back"
      subtitle="Enter your email and password to access your account"
      footer={
        <div className="flex flex-col items-center gap-3">
          <span>
            Don&apos;t have an account?{" "}
            <Link
              href={`/${locale}/sign-up`}
              className="font-bold text-[#141414] hover:text-[#C97612] transition-colors"
            >
              Sign Up
            </Link>
          </span>
          <Link
            href={`/${locale}/admin-login`}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-[#141414] transition-colors"
          >
            <ShieldCheck className="h-3 w-3" />
            Admin login
          </Link>
        </div>
      }
    >
      <SignIn appearance={clerkAuthAppearance} />
    </AuthShell>
  );
}
