# Android & iOS apps

The marketplace ships to mobile two ways:

## 1. PWA (live now)

The site is a full Progressive Web App — `src/app/manifest.ts` + installable
icons. On Android (Chrome) and iOS (Safari → Share → Add to Home Screen) it
installs with the DXB icon, standalone window, and the warm-ivory theme.

## 2. Native shells with Capacitor (store distribution)

`capacitor.config.ts` is pre-configured. The Next.js app is server-rendered
(Clerk auth, API routes, catalog cron), so the native apps wrap the deployed
site and layer native plugins on top (push notifications, camera capture for
listing photos — both in the proposal's Phase 5).

```bash
# one-time
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios     # macOS + Xcode required

# point the shell at your deployment (defaults to https://dxbmotors.ae)
set CAP_SERVER_URL=https://your-deployment.vercel.app

# each release
npx cap sync
npx cap open android   # Android Studio → build AAB for Play Store
npx cap open ios       # Xcode → archive for App Store
```

Recommended native plugins when you're ready:

- `@capacitor/push-notifications` — saved-search & price-drop alerts
- `@capacitor/camera` — one-tap listing photos from the yard
- `@capacitor/share` — share listings to WhatsApp (huge in UAE)
- `@capacitor/app` — deep links (`ae.dxbmotors.app://listings/...`)

If you later want fully-native UI (Phase 5 of the proposal), the API surface
(`/api/listings`, `/api/catalog`, `/api/leads`, `/api/search`) is already
JSON-first, so a React Native/Expo client can reuse the entire backend as-is.
