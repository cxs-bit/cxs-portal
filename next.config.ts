import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: {
    "/api/search": ["./content/blog/*.mdx"],
    "/blog/*/opengraph-image*": ["./content/blog/*.mdx"],
    "/preview": ["./content/blog/*.mdx"],
    "/preview/**/*": ["./content/blog/**/*"],
  },
  async headers() {
    return ["/preview/:path*", "/api/auth/:path*"].map((source) => ({
      source,
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    }));
  },
};

export default config;
