import { SignIn } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { ShieldCheck } from "lucide-react";
import { AuthShell, clerkAuthAppearance } from "@/components/auth/auth-shell";
import { RoleChoiceCards } from "@/components/auth/role-choice-cards";

export default async function SignInPage() {
  return (
    <AuthShell
      eyebrow="A wise choice"
      quoteLines={["Drive", "Everything", "You Want"]}
      quoteSub="Verified cars, trusted dealers, and worldwide export. Trust the process — enjoy the drive."
      title="Welcome Back"
      subtitle="Enter your email and password to access your account"
      footer={
        <Link
          href="/admin-login"
          className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-[#141414] transition-colors"
        >
          <ShieldCheck className="h-3 w-3" />
          Admin login
        </Link>
      }
    >
      <SignIn appearance={clerkAuthAppearance} fallbackRedirectUrl="/post-auth" />

      {/* New here? Surface the buyer/dealer choice one click away from login. */}
      <div className="mt-6 pt-6 border-t border-[#E7E4DA]">
        <p className="text-center text-xs font-semibold text-[#141414] mb-3">
          New to DXB Motors? Join as a…
        </p>
        <RoleChoiceCards compact />
      </div>
    </AuthShell>
  );
}
