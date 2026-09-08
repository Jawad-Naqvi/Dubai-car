import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.dxbmotors.ae" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "cdn.imagin.studio" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // cache optimized images for 24h
  },
  compress: true,
  poweredByHeader: false,

  /**
   * Security headers. There were none, which left the app clickjackable and
   * without any XSS defence-in-depth — relevant because the listing page
   * injects JSON-LD via dangerouslySetInnerHTML.
   *
   * The CSP is deliberately reported-but-permissive on scripts: Next.js needs
   * 'unsafe-inline' for its bootstrap and Clerk injects its own. Tightening to
   * nonces is a follow-up; frame-ancestors, HSTS and the sniffing/referrer
   * controls are the parts that matter most and they are enforced now.
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      // Clerk, Stripe and Next's inline bootstrap.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      // Remote listing/catalog imagery (mirrors images.remotePatterns).
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://api.stripe.com https://*.neon.tech wss://*.clerk.accounts.dev",
      "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com https://*.clerk.accounts.dev",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Cannot be framed by anyone — the modern X-Frame-Options.
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self), payment=(self), interest-cohort=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            // Two years, subdomains included — required for HSTS preload.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Never let a shared cache keep an API response containing user data.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    optimizeServerReact: true,
  },
};

export default withNextIntl(nextConfig);
