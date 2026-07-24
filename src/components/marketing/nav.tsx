"use client";

import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X, Globe, Heart, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/brand";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { AccountMenu } from "./account-menu";
import { NavSearch } from "./nav-search";
import { useSavedListings } from "@/lib/saved-listings";
import { useCompare } from "@/lib/compare";

function CountIcon({
  href,
  count,
  label,
  className = "",
  children,
}: {
  href: string;
  count: number;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-secondary hover:text-[#141414] hover:border-[#141414]/20 transition-colors ${className}`}
    >
      {children}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-[#8136B2] text-white text-[9px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}

const navItems = [
  { key: "buy", href: "/buy" },
  { key: "newCars", href: "/new-cars" },
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
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? "buyer";
  const isSeller = role === "dealer" || role === "admin" || role === "b2b_importer";

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === "en" ? "ar" : "en" });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E5EA]">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Wordmark */}
        <Link href="/" className="flex-shrink-0 group">
          <span className="text-[#141414] font-extrabold text-xl tracking-tight">
            {brand.name}
            <span className="text-[#8136B2]">.</span>
          </span>
        </Link>

        {/* Center links — underline on hover, Meher style */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                data-active={active}
                className="nav-underline py-1 text-[13px] font-medium text-[#141414]/80 hover:text-[#141414] transition-colors"
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <NavSearch />

          <button
            onClick={switchLocale}
            suppressHydrationWarning
            className="hidden md:inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-[#141414] px-2 py-1.5 rounded-full transition-colors"
          >
            <Globe className="h-3 w-3" />
            {locale === "en" ? "AR" : "EN"}
          </button>

          <CountIcon
            href="/compare"
            count={compareCount}
            label="Compare"
            className="hidden sm:inline-flex"
          >
            <GitCompare className="h-4 w-4" />
          </CountIcon>
          <CountIcon href="/saved" count={savedCount} label="Saved cars">
            <Heart className="h-4 w-4" />
          </CountIcon>

          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden md:inline-flex text-[13px] font-medium text-secondary hover:text-[#141414] px-2 py-1.5 transition-colors"
            >
              {t("signIn")}
            </Link>
            <Button asChild variant="gold" size="md">
              <Link href="/sell">{t("listYourCar")}</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            {/* Sellers still get a dashboard link; buyers use the profile menu. */}
            {isSeller && (
              <Link
                href="/dashboard"
                className="hidden md:inline-flex text-[13px] font-medium text-secondary hover:text-[#141414] px-2 py-1.5 transition-colors"
              >
                Dashboard
              </Link>
            )}
            {/* cars.com/Shopify-style account dropdown off the profile icon */}
            <AccountMenu />
          </SignedIn>

          <button
            onClick={() => setOpen(!open)}
            suppressHydrationWarning
            className="lg:hidden h-9 w-9 rounded-full border border-[#141414]/15 text-[#141414] flex items-center justify-center hover:bg-[#141414] hover:text-white transition-colors"
            aria-label="Menu"
          >
            {open ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[#E5E5EA] bg-[#FFFFFF] animate-reveal-up">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-sm font-medium text-secondary hover:text-[#141414] border-b border-[#E5E5EA]"
              >
                {t(item.key)}
              </Link>
            ))}
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-sm font-semibold text-[#141414] border-b border-[#E5E5EA]"
              >
                {t("signIn")}
              </Link>
            </SignedOut>
            <SignedIn>
              {isSeller ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="px-2 py-3 text-sm font-semibold text-[#141414] border-b border-[#E5E5EA]"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/dashboard/saved" onClick={() => setOpen(false)} className="px-2 py-3 text-sm font-semibold text-[#141414] border-b border-[#E5E5EA]">
                    Saved cars
                  </Link>
                  <Link href="/dashboard/alerts" onClick={() => setOpen(false)} className="px-2 py-3 text-sm font-semibold text-[#141414] border-b border-[#E5E5EA]">
                    Alerts
                  </Link>
                  <Link href="/dashboard/messages" onClick={() => setOpen(false)} className="px-2 py-3 text-sm font-semibold text-[#141414] border-b border-[#E5E5EA]">
                    Messages
                  </Link>
                </>
              )}
            </SignedIn>
            <button
              onClick={() => {
                switchLocale();
                setOpen(false);
              }}
              className="mt-2 inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-secondary hover:text-[#141414]"
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
