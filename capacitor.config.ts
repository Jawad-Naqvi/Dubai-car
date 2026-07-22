import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native Android / iOS shell for DXB Motors.
 *
 * The web app is server-rendered (Clerk auth, API routes, catalog sync), so it
 * can't be exported into a device bundle. Instead the native app is a compiled
 * store binary whose WebView renders the deployed site, with native plugins
 * (splash, status bar, push, share, deep links) layered on top — a real native
 * app that covers 100% of the web feature set.
 *
 * Point it at your deployment before building:
 *   set CAP_SERVER_URL=https://your-app.vercel.app   (Windows)
 *   export CAP_SERVER_URL=https://your-app.vercel.app (macOS/Linux)
 */
const SERVER_URL = process.env.CAP_SERVER_URL || "https://dxbmotors.ae";

const config: CapacitorConfig = {
  appId: "ae.dxbmotors.app",
  appName: "DXB Motors",
  // Required by the CLI; unused for content when server.url is set. Holds the
  // PWA icons/manifest so the native project has assets to copy.
  webDir: "public",
  server: {
    url: SERVER_URL,
    cleartext: false,
    androidScheme: "https",
    // Allow Clerk + provider CDNs to load inside the native WebView.
    allowNavigation: [
      "*.dxbmotors.ae",
      "*.clerk.accounts.dev",
      "*.clerk.com",
      "*.vercel.app",
      "cdn.imagin.studio",
      "upload.wikimedia.org",
      "images.unsplash.com",
      "api.dicebear.com",
    ],
  },
  backgroundColor: "#F1EFE9",
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#141414",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#F1EFE9",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
