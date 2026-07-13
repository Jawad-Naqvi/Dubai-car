import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Terms of Service" };

const sections = [
  {
    title: "1. The service",
    body: `${brand.name} is an automotive marketplace connecting buyers, private sellers, dealers, and B2B export buyers in the UAE. We provide the platform; the sale contract for any vehicle is between buyer and seller.`,
  },
  {
    title: "2. Accounts & listings",
    body: `You are responsible for the accuracy of the information in your account and listings. Listings must describe real vehicles you are entitled to sell, with truthful pricing, mileage, and condition. We may moderate, edit, or remove listings that breach these terms.`,
  },
  {
    title: "3. Dealer subscriptions",
    body: `Dealer plans are billed in AED per the pricing page. Listing quotas and features depend on your tier. Fees are non-refundable except where required by law.`,
  },
  {
    title: "4. Acceptable use",
    body: `No fraudulent listings, misrepresentation, scraping, or interference with the platform. We may suspend accounts that put buyers, sellers, or the platform at risk.`,
  },
  {
    title: "5. Liability",
    body: `Vehicle information is provided by sellers. Verify condition and documentation before purchase — inspection and RTA transfer remain the parties' responsibility. To the maximum extent permitted by UAE law, ${brand.name} is not liable for losses arising from transactions between users.`,
  },
  {
    title: "6. Contact",
    body: `Questions about these terms: ${brand.supportEmail}. ${brand.name}, Jebel Ali Free Zone, Dubai, United Arab Emirates.`,
  },
];

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className="relative pt-12 pb-24">
      <div className="mx-auto max-w-3xl px-6">
        <Eyebrow tone="gold">LEGAL</Eyebrow>
        <h1 className="mt-6 text-3xl lg:text-5xl font-light tracking-tight leading-[1.05]">
          Terms of <span className="font-extrabold">Service</span>
        </h1>
        <p className="mt-6 text-sm text-secondary">
          The rules for using the {brand.name} marketplace.
        </p>
        <div className="mt-12 space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-sm font-bold tracking-tight">{s.title}</h2>
              <p className="mt-2 text-sm text-secondary leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
