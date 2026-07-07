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
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-secondary hover:text-[#1A1A1A] hover:bg-[#F4F4F4] transition-colors"
    >
      {children}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#C8A93E] text-white text-[9px] font-bold flex items-center justify-center">
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
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E5E5] shadow-nav">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#D8B84E] to-[#A98F2E] flex items-center justify-center text-white font-black text-[10px]">
            DXB
          </div>
          <span className="text-[#1A1A1A] font-bold text-base tracking-tight group-hover:text-[#A98F2E] transition-colors">
            {brand.name}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-secondary hover:text-[#1A1A1A] transition-colors rounded-lg hover:bg-[#F4F4F4]"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={switchLocale}
            suppressHydrationWarning
            className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-[#1A1A1A] px-2 py-1.5 rounded-lg hover:bg-[#F4F4F4] transition-colors"
          >
            <Globe className="h-3 w-3" />
            {locale === "en" ? "AR" : "EN"}
          </button>

          <CountIcon href="/compare" count={compareCount} label="Compare">
            <GitCompare className="h-4 w-4" />
          </CountIcon>
          <CountIcon href="/saved" count={savedCount} label="Saved cars">
            <Heart className="h-4 w-4" />
          </CountIcon>

          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden md:inline-flex text-sm font-medium text-secondary hover:text-[#1A1A1A] px-2.5 py-1.5 transition-colors"
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
              className="hidden md:inline-flex text-sm font-medium text-secondary hover:text-[#1A1A1A] px-2.5 py-1.5 transition-colors"
            >
              Dashboard
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7 ring-1 ring-[#C8A93E]/40",
                },
              }}
            />
          </SignedIn>

          <button
            onClick={() => setOpen(!open)}
            suppressHydrationWarning
            className="lg:hidden h-9 w-9 rounded-lg border border-[#E5E5E5] text-[#1A1A1A] flex items-center justify-center hover:bg-[#F4F4F4]"
            aria-label="Menu"
          >
            {open ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[#E5E5E5] bg-white shadow-nav">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-sm font-medium text-secondary hover:text-[#1A1A1A] border-b border-[#E5E5E5]"
              >
                {t(item.key)}
              </Link>
            ))}
            <button
              onClick={() => {
                switchLocale();
                setOpen(false);
              }}
              className="mt-2 inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-secondary hover:text-[#1A1A1A]"
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
