import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { VerifyIdentityForm } from "@/components/auth/verify-identity-form";
import { getOrSyncUser } from "@/lib/data/users";
import { CheckCircle2, ShieldCheck, Car, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify your identity — DXB Motors",
  description:
    "Verify your Emirates ID to buy and sell cars on DXB Motors. One Emirates ID, one account.",
};

const PERKS = [
  { icon: Car, title: "Buy with confidence", desc: "Verified members contact sellers and reserve cars." },
  { icon: Tag, title: "Sell your car", desc: "List your own car for buyers across the UAE." },
  { icon: ShieldCheck, title: "Trusted marketplace", desc: "One Emirates ID = one account keeps the platform clean." },
];

export default async function VerifyIdentityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getOrSyncUser().catch(() => null);
  const alreadyVerified = !!user?.idVerified;
  const isDealer = user?.role === "dealer";

  return (
    <div className="mx-auto max-w-5xl px-4 lg:px-6 pt-10 lg:pt-14">
      <div className="max-w-xl">
        <span className="inline-flex items-center rounded-full bg-[#F3EDF9] px-3 py-1 text-[11px] font-semibold text-[#6B21A8]">
          Individual account
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#141414] leading-[1.1]">
          Verify once, <span className="font-extrabold">buy &amp; sell</span>
        </h1>
        <p className="mt-3 text-sm text-secondary leading-relaxed">
          Every DXB Motors account is tied to an Emirates ID. Verify yours once and you can browse,
          contact sellers, and list your own car — all from one account.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-2xl bg-white shadow-card p-4">
              <span className="h-8 w-8 rounded-full bg-[#F4F4F6] flex items-center justify-center mb-2.5">
                <p.icon className="h-4 w-4 text-[#8136B2]" />
              </span>
              <h3 className="text-sm font-semibold text-[#141414]">{p.title}</h3>
              <p className="mt-1 text-xs text-secondary leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div>
          <SignedIn>
            {alreadyVerified ? (
              <div className="rounded-2xl bg-white shadow-card p-6 lg:p-8 text-center">
                <span className="mx-auto h-11 w-11 rounded-full bg-[#137A43]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#137A43]" />
                </span>
                <h2 className="mt-3 text-base font-bold text-[#141414]">Your identity is verified</h2>
                <p className="mt-2 text-xs text-secondary leading-relaxed">
                  You&apos;re all set to buy and sell on DXB Motors.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Button asChild variant="gold" size="lg">
                    <Link href="/dashboard">Open dashboard</Link>
                  </Button>
                  <Button asChild variant="gold_outline" size="lg">
                    <Link href="/sell/new">List a car</Link>
                  </Button>
                </div>
              </div>
            ) : isDealer ? (
              <div className="rounded-2xl bg-white shadow-card p-6 lg:p-8 text-center">
                <h2 className="text-base font-bold text-[#141414]">You have a dealer account</h2>
                <p className="mt-2 text-xs text-secondary leading-relaxed">
                  Dealers verify through the seller onboarding (Emirates ID + trade license).
                </p>
                <Button asChild variant="gold" size="lg" className="mt-5 w-full">
                  <Link href="/sell/become-seller">Go to seller onboarding</Link>
                </Button>
              </div>
            ) : (
              <VerifyIdentityForm redirectTo="/" />
            )}
          </SignedIn>
          <SignedOut>
            <div className="rounded-2xl bg-white shadow-card p-6 lg:p-8 text-center">
              <h2 className="text-base font-bold text-[#141414]">Sign in to verify</h2>
              <p className="mt-2 text-xs text-secondary leading-relaxed">
                Create a free account or sign in, then verify your Emirates ID in one step.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button asChild variant="gold" size="lg">
                  <Link href="/sign-up?role=individual">Create an account</Link>
                </Button>
                <Button asChild variant="gold_outline" size="lg">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </div>
            </div>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
