import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { getDealers } from "@/lib/data/dealers";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadialGlow } from "@/components/marketing/radial-glow";
import { BadgeCheck, Star, MapPin, Car as CarIcon } from "lucide-react";

export default async function DealersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const dealers = await getDealers();

  return (
    <>
      <section className="relative pt-12 pb-16 overflow-hidden">
        <RadialGlow color="gold" size="lg" className="-top-20 -right-20 opacity-20" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-6">
          <Eyebrow tone="gold">VERIFIED DEALER DIRECTORY</Eyebrow>
          <h1 className="mt-6 text-sm lg:text-2xl font-bold tracking-tight leading-[1.05] max-w-3xl">
            {dealers.length} verified yards across the UAE
          </h1>
          <p className="mt-6 text-sm text-secondary max-w-xl">
            All dealers carry valid trade licenses and pass our verification
            process. Browse storefronts, see inventory, contact directly.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dealers.map((d) => (
              <Link
                key={d.id}
                href={`/dealers/${d.slug}`}
                className="group rounded-xl bg-white border border-[#E5E5E5] overflow-hidden shadow-card hover:shadow-card-hover hover:border-[#C8A93E]/40 transition-all hover:-translate-y-1"
              >
                <div className="aspect-[16/9] bg-[#F4F4F4] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.3),transparent_55%)]" />
                  {d.isFeatured && (
                    <Badge tone="featured" className="absolute top-3 left-3">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="p-6 -mt-10 relative">
                  <div className="h-16 w-16 rounded-sm bg-gradient-to-br from-[#D8B84E] to-[#A98F2E] flex items-center justify-center text-white font-bold text-sm border-4 border-white">
                    {d.name.charAt(0)}
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm truncate group-hover:text-[#A98F2E] transition-colors">
                      {d.name}
                    </h3>
                    {d.isVerified && (
                      <BadgeCheck className="h-4 w-4 text-[#C8A93E] flex-shrink-0" />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-secondary line-clamp-2">
                    {d.tagline}
                  </p>
                  <div className="mt-5 pt-5 border-t border-[#E5E5E5] grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-secondary">
                      <Star className="h-3 w-3 fill-[#C8A93E] text-[#C8A93E]" />
                      {d.rating}
                    </div>
                    <div className="flex items-center gap-1 text-secondary">
                      <CarIcon className="h-3 w-3 text-muted" />
                      {d.listingCount}
                    </div>
                    <div className="flex items-center gap-1 text-secondary justify-end">
                      <MapPin className="h-3 w-3 text-muted" />
                      {d.emirate}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
