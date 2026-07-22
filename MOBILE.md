# Native Android & iOS apps

DXB Motors ships as **real, store-shippable native apps** (not a PWA) using a
Capacitor native shell. The compiled app is a native binary (APK/AAB on
Android, IPA on iOS) whose WebView renders the full deployed web app, with
native capabilities layered on: splash screen, status bar theming, hardware
back button, push notifications, share sheet, and deep links.

Why a shell and not a React Native rewrite: the web app is server-rendered
(Clerk auth, API routes, server components, catalog sync). The shell reuses
that entire backend and every screen as-is, so the native app covers 100% of
the web feature set with one codebase — no duplicated UI to drift out of sync.

## What's in the repo

- `capacitor.config.ts` — app id `ae.dxbmotors.app`, plugins, and the server
  URL the app loads (see below).
- `android/` — the **generated native Android Studio project** (committed), with
  all 6 plugins wired: App, Browser, Push Notifications, Share, Splash Screen,
  Status Bar.
- `src/components/native/native-bridge.tsx` — mounted globally; a no-op on the
  web, but inside the native app it themes the status bar, hides the splash,
  handles the Android back button, registers for push, and routes deep links.

## Point it at your deployment (required)

The app loads a live URL, so deploy the web app first (Vercel/hosting), then:

```bash
# Windows
set CAP_SERVER_URL=https://your-app.vercel.app
# macOS / Linux
export CAP_SERVER_URL=https://your-app.vercel.app

npx cap sync android
```

Without a deployment the shell builds fine but shows your production domain
(`https://dxbmotors.ae`) — update `allowNavigation` in `capacitor.config.ts` if
your auth/CDN hosts differ.

## Build the Android app

Prereqs (already present on the build machine used here): JDK 17+ (JDK 21 works)
and the Android SDK (platform 34, build-tools 34). The Gradle **wrapper** fetches
Gradle itself — no global install needed.

```bash
cd android
# JAVA_HOME must point at a JDK 17+; sdk.dir is in android/local.properties
./gradlew assembleDebug          # → android/app/build/outputs/apk/debug/app-debug.apk
# release (signed) build for the Play Store:
./gradlew bundleRelease          # → .aab  (configure signing in android/app/build.gradle)
```

Install the debug APK on a device/emulator:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Or open it in Android Studio to run/debug: `npx cap open android`.

## Build the iOS app (needs a Mac)

iOS **cannot** be built on Windows — Apple requires macOS + Xcode. On a Mac:

```bash
npm i @capacitor/ios@6
npx cap add ios
export CAP_SERVER_URL=https://your-app.vercel.app
npx cap sync ios
npx cap open ios         # Xcode → set signing team → Archive → App Store Connect
```

## Icons & splash

Generate branded launcher icons and splash from a source image:

```bash
npm i -D @capacitor/assets
# put a 1024×1024 icon at resources/icon.png and a 2732×2732 splash at resources/splash.png
npx capacitor-assets generate
```

The `public/icons/icon.svg` used by the PWA is a good source for the icon.

## Push notifications — server side

`native-bridge.tsx` registers the device and receives an FCM/APNs token. To
deliver saved-search and price-drop alerts:

1. Create a Firebase project, add the Android app (`ae.dxbmotors.app`), and drop
   `google-services.json` into `android/app/`.
2. POST the device token from the `registration` listener to a
   `/api/push/register` endpoint (store it against the user).
3. Send via FCM from your alert cron (the `savedSearches` table already exists).

## Native plugins available (installed)

`@capacitor/app` (deep links, back button, lifecycle), `@capacitor/browser`
(in-app browser), `@capacitor/push-notifications`, `@capacitor/share`,
`@capacitor/splash-screen`, `@capacitor/status-bar`. Add `@capacitor/camera`
for one-tap listing photos when you wire the native capture flow.
