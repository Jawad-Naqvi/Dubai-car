import { setRequestLocale } from "next-intl/server";
import { PartnerApplyForm } from "@/components/freight/partner-apply-form";
import { getDestinationCountries } from "@/lib/data/countries";
import { Ship, ShieldCheck, Globe2, Handshake } from "lucide-react";

/**
 * The public front door for freight forwarders.
 *
 * Applying grants nothing — it creates a record an admin reviews, who then
 * sends a private onboarding link. That's why "freight forwarder" never
 * appears as an option on the ordinary sign-up flow.
 */
export default async function PartnerApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const destinations = await getDestinationCountries();

  const points = [
    {
      icon: Handshake,
      title: "Qualified work, not cold leads",
      body: "Buyers have already paid for a car. They need it moved — you quote on a real shipment.",
    },
    {
      icon: Globe2,
      title: "Only the lanes you run",
      body: "Register your corridors and modes. You'll only see requests you can actually serve.",
    },
    {
      icon: ShieldCheck,
      title: "One place for the whole job",
      body: "Milestones, documents and the conversation with buyer and seller live on one timeline.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 lg:px-6 py-10 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-10 items-start">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3EDF9] px-3 py-1 text-[11px] font-semibold text-[#6B21A8]">
            <Ship className="h-3 w-3" />
            Partner network
          </span>
          <h1 className="mt-3 text-2xl lg:text-3xl font-extrabold tracking-tight text-[#141414]">
            Move cars for buyers who&apos;ve already bought
          </h1>
          <p className="mt-2 text-sm text-secondary max-w-xl leading-relaxed">
            Our buyers purchase cars here and need them shipped home. Join the
            partner network to quote on those shipments, handle the paperwork,
            and keep everyone updated from one place.
          </p>

          <ul className="mt-7 space-y-5">
            {points.map((p) => (
              <li key={p.title} className="flex items-start gap-3">
                <span className="h-9 w-9 rounded-xl bg-[#F4F4F6] grid place-items-center flex-shrink-0">
                  <p.icon className="h-4 w-4 text-[#8136B2]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[#141414]">
                    {p.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-secondary leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-xl border border-[#E5E5EA] bg-[#F4F4F6] p-4">
            <h3 className="text-xs font-bold text-[#141414]">
              How onboarding works
            </h3>
            <ol className="mt-2 space-y-1.5 text-[11px] text-secondary leading-relaxed">
              <li>1. You apply here.</li>
              <li>2. We review your licences and lanes — usually 1–2 days.</li>
              <li>3. We email you a private onboarding link.</li>
              <li>4. You set up your account and start receiving requests.</li>
            </ol>
          </div>
        </div>

        <PartnerApplyForm countries={destinations} />
      </div>
    </div>
  );
}
