import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Microphone is needed by the Speaking module on our own origin only.
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

if (process.env.NODE_ENV === "production") securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  outputFileTracingIncludes: { "/**": ["./drizzle/**/*"] },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Listening audio changes only when regenerated; let browsers and the CDN reuse it.
      { source: "/audio/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
    ];
  },
};

export default nextConfig;
