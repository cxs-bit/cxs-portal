import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return indexable
    ? { rules: { userAgent: "*", allow: "/", disallow: ["/preview/", "/api/auth/"] }, sitemap: new URL("/sitemap.xml", siteUrl).href }
    : { rules: { userAgent: "*", allow: "/" } };
}
