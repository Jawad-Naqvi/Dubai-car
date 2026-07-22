"use client";

import { useEffect } from "react";

/**
 * Native runtime bridge. Only does anything inside the Capacitor native app
 * (Android/iOS) — on the web every call is a no-op, so this is safe to mount
 * globally. Dynamically imports the Capacitor plugins so the web bundle never
 * pulls native code.
 *
 * Handles:
 *  - status bar + splash screen theming
 *  - Android hardware back button (navigate back, exit on root)
 *  - push-notification registration (token handed to the server later)
 *  - deep links (dxbmotors:// and https app links) → client navigation
 */
export function NativeBridge() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const core = await import("@capacitor/core").catch(() => null);
      if (!core?.Capacitor?.isNativePlatform?.()) return;

      const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
        import("@capacitor/app"),
      ]);

      try {
        await StatusBar.setStyle({ style: Style.Light });
      } catch {
        /* iOS without config — ignore */
      }
      await SplashScreen.hide().catch(() => {});

      // Android hardware back: go back, or exit at the root.
      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else App.exitApp();
      });

      // Deep links → same-origin client navigation.
      const url = await App.addListener("appUrlOpen", ({ url }) => {
        try {
          const u = new URL(url);
          const path = u.pathname + u.search + u.hash;
          if (path) window.location.assign(path);
        } catch {
          /* malformed link — ignore */
        }
      });

      // Best-effort push registration (permission prompt on iOS/Android 13+).
      import("@capacitor/push-notifications")
        .then(async ({ PushNotifications }) => {
          const perm = await PushNotifications.requestPermissions();
          if (perm.receive === "granted") await PushNotifications.register();
        })
        .catch(() => {});

      cleanup = () => {
        back.remove();
        url.remove();
      };
    })();

    return () => cleanup?.();
  }, []);

  return null;
}
