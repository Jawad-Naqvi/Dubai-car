"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Menu, X, Globe, Heart, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useSavedListings } from "@/lib/saved-listings";
import { useCompare } from "@/lib/compare";

function CountIcon({
  href,
  count,
  label,
  children,
}: {
  href: string;
  count: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm text-secondary hover:text-white hover:bg-white/5 transition-colors"
    >
      {children}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#F0CE5C] text-[#1A1208] text-[9px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}

const navItems = [
  { key: "buy", href: "/buy" },
  { key: "sell", href: "/sell" },
  { key: "export", href: "/export" },
  { key: "valuation", href: "/valuation" },
  { key: "dealers", href: "/dealers" },
  { key: "pricing", href: "/pricing" },
];

export function Nav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { count: savedCount } = useSavedListings();
  const { count: compareCount } = useCompare();

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "en" ? "ar" : "en" });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0A0A]/85 border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="h-6 w-6 rounded-sm bg-gradient-to-br from-[#F0CE5C] via-[#D4AF37] to-[#8C7220] flex items-center justify-center text-[#1A1208] font-black text-[10px]">
            DXB
          </div>
          <span className="text-white font-bold text-sm tracking-tight group-hover:text-[#F0CE5C] transition-colors">
            {brand.name}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="px-3 py-1.5 text-xs text-secondary hover:text-white transition-colors rounded-sm hover:bg-white/5"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={switchLocale}
            suppressHydrationWarning
            className="hidden md:inline-flex items-center gap-1 text-[11px] text-secondary hover:text-white px-2 py-1 rounded-sm hover:bg-white/5 transition-colors"
          >
            <Globe className="h-3 w-3" />
            {locale === "en" ? "AR" : "EN"}
          </button>

          <CountIcon href="/compare" count={compareCount} label="Compare">
            <GitCompare className="h-3.5 w-3.5" />
          </CountIcon>
          <CountIcon href="/saved" count={savedCount} label="Saved cars">
            <Heart className="h-3.5 w-3.5" />
          </CountIcon>

          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden md:inline-flex text-xs text-secondary hover:text-white px-2 py-1 transition-colors"
            >
              {t("signIn")}
            </Link>
            <Button asChild variant="gold" size="md">
              <Link href="/sell">{t("listYourCar")}</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="hidden md:inline-flex text-xs text-secondary hover:text-white px-2 py-1 transition-colors"
            >
              Dashboard
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7 ring-1 ring-[#D4AF37]/30",
                },
              }}
            />
          </SignedIn>

          <button
            onClick={() => setOpen(!open)}
            suppressHydrationWarning
            className="lg:hidden h-8 w-8 rounded-sm border border-white/10 flex items-center justify-center"
            aria-label="Menu"
          >
            {open ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/5 bg-[#0A0A0A]/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-2 py-2.5 text-sm text-secondary hover:text-white border-b border-white/5"
              >
                {t(item.key)}
              </Link>
            ))}
            <button
              onClick={() => {
                switchLocale();
                setOpen(false);
              }}
              className="mt-2 inline-flex items-center gap-2 px-2 py-2 text-xs text-secondary hover:text-white"
            >
              <Globe className="h-3.5 w-3.5" />
              {locale === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
