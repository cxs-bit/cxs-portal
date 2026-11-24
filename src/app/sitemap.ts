import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/posts";
import { channels } from "@/lib/channel-catalog";
import { getPublishedChannels } from "@/lib/channels";
import { indexable, projects, siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexable) return [];
  const posts = await listPublishedPosts();
  const published = await getPublishedChannels();
  const destinations = channels.filter(item => item.id === "portfolio" || published[item.id]);
  return [
    ...["/", "/projects", "/blog", ...destinations.map(item => item.href), ...projects.map(({ href }) => href).filter((href) => href.startsWith("/") && !href.startsWith("//"))]
      .map((path) => ({ url: new URL(path, siteUrl).href })),
    ...posts.map(({ slug, date }) => ({ url: new URL(`/blog/${slug}`, siteUrl).href, lastModified: date })),
  ];
}
