import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/eyebrow";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy Policy" };

const sections = [
  {
    title: "1. What we collect",
    body: `We collect the information you provide when you create an account, list a vehicle, request a valuation, or contact a seller — such as your name, email, phone number, and vehicle details. We also collect standard usage data (pages visited, device and browser information) to keep the platform secure and improve it.`,
  },
  {
    title: "2. How we use it",
    body: `Your information is used to operate the marketplace: publishing listings, routing buyer enquiries to sellers, processing subscription payments, verifying dealers, and sending service notifications you have opted into. We do not sell your personal data to third parties.`,
  },
  {
    title: "3. Sharing",
    body: `When you send an enquiry on a listing, the details you submit are shared with that seller so they can respond. We use trusted processors for authentication, payments, and hosting, bound by their own data-protection obligations.`,
  },
  {
    title: "4. Retention & your rights",
    body: `We keep personal data only as long as needed for the purposes above or as required by UAE law. You can request access, correction, or deletion of your data at any time by contacting us.`,
  },
  {
    title: "5. Contact",
    body: `For any privacy question or request, email ${brand.supportEmail}. ${brand.name} operates from Jebel Ali Free Zone, Dubai, United Arab Emirates.`,
  },
];

export default async function PrivacyPage({
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
          Privacy <span className="font-extrabold">Policy</span>
        </h1>
        <p className="mt-6 text-sm text-secondary">
          How {brand.name} collects, uses, and protects your information.
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
