import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Conserve la configuration de vos images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      ...(process.env.SUPABASE_URL ? [{ protocol: 'https' as const, hostname: new URL(process.env.SUPABASE_URL).hostname, port: '', pathname: '/storage/v1/object/public/**' }] : []),
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    const noIndex = { key: "X-Robots-Tag", value: "noindex, nofollow" };
    // Demo by default. Enable public indexing only when the real site launches.
    if (process.env.SITE_INDEXABLE !== "true") securityHeaders.push(noIndex);

    return [
      { source: "/:path*", headers: securityHeaders },
      ...["admin", "profil", "panier", "commande", "auth"].map((path) => ({
        source: `/${path}/:path*`, headers: [noIndex],
      })),
    ];
  },
};

export default nextConfig;
