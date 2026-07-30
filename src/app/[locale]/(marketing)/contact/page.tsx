import { setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RadialGlow } from "@/components/marketing/radial-glow";
import { ContactForm } from "@/components/marketing/contact-form";
import { brand } from "@/lib/brand";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className="relative pt-12 pb-24 overflow-hidden">
      <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-25" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Eyebrow tone="gold">CONTACT</Eyebrow>
            <h1 className="mt-6 text-3xl lg:text-5xl font-light tracking-tight leading-[1.05]">
              Talk to <span className="font-extrabold">our team</span>.
            </h1>
            <p className="mt-6 text-sm text-secondary max-w-xl">
              Whether you run a yard, want to import in bulk, or need help
              listing your car — we get back within one business day.
            </p>

            <div className="mt-10 space-y-4">
              <a
                href={`mailto:${brand.email}`}
                className="flex items-center gap-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5 hover:border-[#D8D4C6] hover:shadow-card-hover transition-all"
              >
                <div className="h-11 w-11 rounded-full bg-[#F3EDF9] flex items-center justify-center">
                  <Mail className="h-5 w-5 text-[#8136B2]" />
                </div>
                <div>
                  <div className="text-xs text-muted">Email</div>
                  <div className="font-semibold">{brand.email}</div>
                </div>
              </a>
              <a
                href={`tel:${brand.whatsapp}`}
                className="flex items-center gap-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5 hover:border-[#D8D4C6] hover:shadow-card-hover transition-all"
              >
                <div className="h-11 w-11 rounded-full bg-[#F3EDF9] flex items-center justify-center">
                  <Phone className="h-5 w-5 text-[#8136B2]" />
                </div>
                <div>
                  <div className="text-xs text-muted">Phone</div>
                  <div className="font-semibold">{brand.whatsapp}</div>
                </div>
              </a>
              <a
                href={brand.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5 hover:border-[#D8D4C6] hover:shadow-card-hover transition-all"
              >
                <div className="h-11 w-11 rounded-full bg-[#F3EDF9] flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-[#8136B2]" />
                </div>
                <div>
                  <div className="text-xs text-muted">WhatsApp</div>
                  <div className="font-semibold">Chat with sales</div>
                </div>
              </a>
              <div className="flex items-center gap-4 rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5">
                <div className="h-11 w-11 rounded-full bg-[#F3EDF9] flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-[#8136B2]" />
                </div>
                <div>
                  <div className="text-xs text-muted">Office</div>
                  <div className="font-semibold">
                    Dubai Internet City, Dubai, UAE
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
