/* Minimal local type so the repo typechecks before Capacitor is installed.
   Once you `npm i @capacitor/cli`, you can switch to:
   import type { CapacitorConfig } from "@capacitor/cli"; */
interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: { url?: string; cleartext?: boolean };
  ios?: { contentInset?: string };
  android?: { allowMixedContent?: boolean };
}

/**
 * Native Android/iOS shells for the marketplace.
 *
 * The Next.js app is server-rendered (Clerk auth, API routes, catalog sync),
 * so the native apps wrap the deployed site in a Capacitor WebView with
 * native plugins (push, camera for listing photos) layered on top.
 *
 * Build steps (see MOBILE.md):
 *   npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
 *   npx cap add android && npx cap add ios
 *   npx cap sync && npx cap open android
 */
const config: CapacitorConfig = {
  appId: "ae.dxbmotors.app",
  appName: "DXB Motors",
  webDir: "public", // placeholder — remote server.url is the real content source
  server: {
    url: process.env.CAP_SERVER_URL ?? "https://dxbmotors.ae",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
