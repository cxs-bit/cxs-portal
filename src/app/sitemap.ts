import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/posts";
import { indexable, projects, siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexable) return [];
  const posts = await listPublishedPosts();
  return [
    ...["/", "/projects", "/blog", ...projects.map(({ href }) => href).filter((href) => href.startsWith("/") && !href.startsWith("//"))]
      .map((path) => ({ url: new URL(path, siteUrl).href })),
    ...posts.map(({ slug, date }) => ({ url: new URL(`/blog/${slug}`, siteUrl).href, lastModified: date })),
  ];
}
