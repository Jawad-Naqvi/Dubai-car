import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDealerBySlug } from "@/lib/data/dealers";
import { brand } from "@/lib/brand";
import { whatsappLink } from "@/lib/utils";
import { searchListings } from "@/lib/data/listings";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/listing-card";
import { ReviewsSection } from "@/components/dealers/reviews-section";
import { RadialGlow } from "@/components/marketing/radial-glow";
import {
  BadgeCheck,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Mail,
  Clock,
} from "lucide-react";

export default async function DealerStorefront({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const dealer = await getDealerBySlug(slug);
  if (!dealer) notFound();

  const inventory = (
    await searchListings({ dealerSlug: slug, perPage: 24 })
  ).items;

  return (
    <>
      <section className="relative">
        <div className="h-48 lg:h-64 bg-[#FBE7D4] relative overflow-hidden">
          <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-6 -mt-20">
          <div className="rounded-3xl bg-white border border-[#E7E4DA] shadow-card p-5 lg:p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="h-24 w-24 lg:h-28 lg:w-28 rounded-full bg-[#181C30] flex items-center justify-center text-white font-black text-2xl flex-shrink-0 ring-4 ring-white">
                {dealer.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                    {dealer.name}
                  </h1>
                  {dealer.isVerified && (
                    <BadgeCheck className="h-6 w-6 text-[#F0941F]" />
                  )}
                  {dealer.isFeatured && <Badge tone="featured">Featured</Badge>}
                </div>
                <p className="mt-2 text-secondary">{dealer.tagline}</p>

                <div className="mt-5 flex flex-wrap gap-5 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-[#F0941F] text-[#F0941F]" />
                    <span className="font-semibold">{dealer.rating}</span>
                    <span className="text-muted">({dealer.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary">
                    <MapPin className="h-4 w-4 text-muted" />
                    {dealer.emirate}, UAE
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary">
                    <Clock className="h-4 w-4 text-muted" />
                    Open · 9am – 9pm
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="gold" size="md">
                  <a href={`tel:${dealer.phone ?? brand.whatsapp}`}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
                <Button asChild variant="emerald" size="md">
                  <a
                    href={whatsappLink(
                      dealer.whatsapp ?? brand.whatsapp,
                      `Hi ${dealer.name}, I found your showroom on ${brand.name} and I'd like to know more about your inventory.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="ghost" size="md">
                  <Link href="/contact">
                    <Mail className="h-4 w-4" />
                    Message
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Eyebrow tone="gold">INVENTORY</Eyebrow>
              <h2 className="mt-3 text-2xl lg:text-3xl font-bold tracking-tight">
                {inventory.length} active listings
              </h2>
            </div>
          </div>

          {inventory.length === 0 ? (
            <div className="rounded-3xl bg-white border border-[#E7E4DA] shadow-card p-6 text-center text-muted">
              No active listings yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {inventory.map((l) => (
                <ListingCard key={l.id} listing={l} locale={locale as "en" | "ar"} />
              ))}
            </div>
          )}
        </div>
      </section>

      <ReviewsSection slug={slug} />
    </>
  );
}
