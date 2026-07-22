import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { BecomeSellerForm } from "@/components/sell/become-seller-form";
import { getCurrentDealer } from "@/lib/data/users";
import { CheckCircle2, BarChart3, Inbox, Ship, Clock, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Become a Seller — list your yard on DXB Motors",
  description:
    "Register your dealership or yard, manage inventory, and reach local buyers and global importers.",
};

const PERKS = [
  { icon: Inbox, title: "Qualified lead inbox", desc: "Every buyer inquiry lands in one place with contact details." },
  { icon: BarChart3, title: "Live analytics", desc: "Views, leads, and response rate per listing." },
  { icon: Ship, title: "Export visibility", desc: "Get your export-ready stock in front of B2B importers." },
  { icon: CheckCircle2, title: "Verified badge", desc: "Trade-license verification builds buyer trust." },
];

export default async function BecomeSellerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const dealer = await getCurrentDealer();

  return (
    <div className="mx-auto max-w-5xl px-4 lg:px-6 pt-10 lg:pt-14">
      <div className="max-w-xl">
        <span className="inline-flex items-center rounded-full bg-[#FBE7D4] px-3 py-1 text-[11px] font-semibold text-[#C97612]">
          For yards, dealers & vendors
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#141414] leading-[1.1]">
          Sell smarter with a <span className="font-extrabold">seller account</span>
        </h1>
        <p className="mt-3 text-sm text-secondary leading-relaxed">
          List your inventory, manage leads, and reach buyers across the UAE and export
          markets — all from one dashboard.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 items-start">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-2xl bg-white shadow-card p-4">
              <span className="h-8 w-8 rounded-full bg-[#F3F1E9] flex items-center justify-center mb-2.5">
                <p.icon className="h-4 w-4 text-[#F0941F]" />
              </span>
              <h3 className="text-sm font-semibold text-[#141414]">{p.title}</h3>
              <p className="mt-1 text-xs text-secondary leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div>
          <SignedIn>
            {dealer?.kycStatus === "approved" ? (
              <div className="rounded-3xl bg-white shadow-card p-6 lg:p-8 text-center">
                <span className="mx-auto h-11 w-11 rounded-full bg-[#137A43]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#137A43]" />
                </span>
                <h2 className="mt-3 text-base font-bold text-[#141414]">You&apos;re a verified seller</h2>
                <p className="mt-2 text-xs text-secondary leading-relaxed">
                  {dealer.businessName} is approved and ready to list inventory.
                </p>
                <Button asChild variant="gold" size="lg" className="mt-5 w-full">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              </div>
            ) : dealer?.kycStatus === "pending" ? (
              <div className="rounded-3xl bg-white shadow-card p-6 lg:p-8 text-center">
                <span className="mx-auto h-11 w-11 rounded-full bg-[#F0941F]/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#F0941F]" />
                </span>
                <h2 className="mt-3 text-base font-bold text-[#141414]">Application under review</h2>
                <p className="mt-2 text-xs text-secondary leading-relaxed">
                  We&apos;re verifying {dealer.businessName}&apos;s Emirates ID and trade license.
                  You&apos;ll get an email as soon as a decision is made, usually within 1-2
                  business days.
                </p>
              </div>
            ) : dealer?.kycStatus === "rejected" ? (
              <div className="rounded-3xl bg-white shadow-card p-6 lg:p-8">
                <div className="text-center">
                  <span className="mx-auto h-11 w-11 rounded-full bg-[#DC2626]/10 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-[#DC2626]" />
                  </span>
                  <h2 className="mt-3 text-base font-bold text-[#141414]">
                    Application needs changes
                  </h2>
                  {dealer.kycRejectionReason && (
                    <p className="mt-2 text-xs text-[#DC2626] bg-[#DC2626]/5 rounded-xl px-3 py-2 leading-relaxed">
                      {dealer.kycRejectionReason}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-secondary leading-relaxed">
                    Update the details below and resubmit.
                  </p>
                </div>
                <div className="mt-5">
                  <BecomeSellerForm />
                </div>
              </div>
            ) : (
              <BecomeSellerForm />
            )}
          </SignedIn>
          <SignedOut>
            <div className="rounded-3xl bg-white shadow-card p-6 lg:p-8 text-center">
              <h2 className="text-base font-bold text-[#141414]">Sign in to continue</h2>
              <p className="mt-2 text-xs text-secondary leading-relaxed">
                Create a free account or sign in, then set up your yard in one step.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button asChild variant="gold" size="lg">
                  <Link href="/sign-up">Create an account</Link>
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
