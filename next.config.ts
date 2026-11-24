import type { NextConfig } from "next";

const previewBranch = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === "preview";

const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: {
    "/*": ["./content/channels/work.json", "./content/channels/personal.json"],
    ...(previewBranch ? {
      "/": ["./content/channels/private/*.json"],
      "/\\[channel\\]": ["./content/channels/private/*.json"],
      "/preview/channel-assets/**/*": ["./content/channels/private/**/*"],
    } : {}),
    "/api/search": ["./content/blog/*.mdx"],
    "/blog/*/opengraph-image*": ["./content/blog/*.mdx"],
    "/preview": ["./content/blog/*.mdx"],
    "/preview/**/*": ["./content/blog/**/*"],
  },
  outputFileTracingExcludes: previewBranch
    ? {}
    : { "/*": ["./content/channels/private/**/*"] },
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
