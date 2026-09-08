"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary.
 *
 * Route-segment error.tsx files cannot catch a crash in the root layout — that
 * previously produced Next.js's unstyled default page with no reporting at
 * all, so the worst class of failure was also the most invisible one.
 *
 * This renders its own <html>/<body> (required: the root layout has failed),
 * reports the error, and shows the digest so a user can quote it to support.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ship to whatever collector is wired up; the endpoint no-ops when the
    // request fails, because an error reporter must never throw.
    try {
      const payload = JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack?.slice(0, 4000),
        url: typeof window !== "undefined" ? window.location.href : undefined,
      });
      navigator.sendBeacon?.("/api/client-error", payload);
    } catch {
      /* reporting is best-effort */
    }
    console.error("[global-error]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#FFFFFF",
          color: "#141414",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: 460, textAlign: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#F3EDF9",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
              fontSize: 20,
            }}
            aria-hidden="true"
          >
            ⚠
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#63666A",
              margin: "0 0 20px",
            }}
          >
            The page failed to load. This has been reported. Try again, or head
            back to the homepage.
          </p>

          <div
            style={{ display: "flex", gap: 8, justifyContent: "center" }}
          >
            <button
              onClick={reset}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 8,
                border: "none",
                background: "#8136B2",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 8,
                border: "1px solid #E5E5EA",
                color: "#141414",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Go home
            </a>
          </div>

          {error.digest && (
            <p style={{ marginTop: 20, fontSize: 11, color: "#8E8E93" }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
