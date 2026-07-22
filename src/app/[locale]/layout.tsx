import type { Metadata } from "next";
import "../globals.css";
import { DM_Sans, Tajawal } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { brand } from "@/lib/brand";
import { Toaster } from "sonner";
import { NativeBridge } from "@/components/native/native-bridge";

/**
 * Self-hosted fonts via next/font — no render-blocking request to Google's CDN,
 * fonts are inlined/preloaded and served same-origin, and there's no layout
 * shift (display: swap + size-adjust handled automatically).
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — Dubai's Yard-Forward Automotive Marketplace`,
    template: `%s · ${brand.name}`,
  },
  description:
    "Buy, sell, and export cars in the UAE on a single operating system. Verified dealers, AI-powered search, and end-to-end B2B export workflows.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "ar")) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      className={`${dmSans.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >
      <body
        className="bg-page text-[#1A1A1A] antialiased"
        style={{
          fontFamily: isRTL
            ? "var(--font-tajawal), var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif"
            : "var(--font-dm-sans), var(--font-tajawal), ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#141414",
              colorBackground: "#FFFFFF",
              colorInputBackground: "#FFFFFF",
              colorInputText: "#141414",
              colorText: "#141414",
              borderRadius: "1rem",
            },
          }}
        >
          <NextIntlClientProvider messages={messages}>
            <NativeBridge />
            {children}
            <Toaster
              theme="light"
              position="top-center"
              toastOptions={{
                style: {
                  background: "#FFFFFF",
                  border: "1px solid #E7E4DA",
                  color: "#1A1A1A",
                },
              }}
            />
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
