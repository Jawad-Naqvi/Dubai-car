import type { Metadata } from "next";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { brand } from "@/lib/brand";
import { Toaster } from "sonner";
import { NativeBridge } from "@/components/native/native-bridge";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap"
        />
        {isRTL && (
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
          />
        )}
      </head>
      <body
        className="bg-page text-[#1A1A1A] antialiased"
        style={{
          fontFamily: isRTL
            ? '"Tajawal", "DM Sans", ui-sans-serif, system-ui, sans-serif'
            : '"DM Sans", "Tajawal", ui-sans-serif, system-ui, sans-serif',
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
