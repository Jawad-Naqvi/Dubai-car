import type { Metadata } from "next";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { brand } from "@/lib/brand";
import { Toaster } from "sonner";

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
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700,800&display=swap"
        />
        {isRTL && (
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
          />
        )}
      </head>
      <body
        className="bg-page text-white antialiased"
        style={{
          fontFamily: isRTL
            ? '"Tajawal", "Switzer", ui-sans-serif, system-ui, sans-serif'
            : '"Switzer", "Tajawal", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#D4AF37",
              colorBackground: "#161616",
              colorInputBackground: "#121212",
              colorInputText: "#FFFFFF",
              colorText: "#FFFFFF",
              borderRadius: "0.75rem",
            },
          }}
        >
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster
              theme="dark"
              position="top-center"
              toastOptions={{
                style: {
                  background: "#161616",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "#fff",
                },
              }}
            />
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
