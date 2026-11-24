import type { SearchResult } from "@/generated/portfolio";
import { channels } from "@/lib/channel-catalog";
import { getPublishedChannels } from "@/lib/channels";
import { listPublishedPosts } from "@/lib/posts";
import { rankSearchResults } from "@/lib/search";
import { projects, site } from "@/lib/site";

const pages: SearchResult[] = [
  { title: "Home", href: "/", description: site.description, kind: "page" },
  { title: "Projects", href: "/projects", description: "Software projects and updates.", kind: "page" },
  { title: "Devlog", href: "/blog", description: "Project updates and notes on building for the web.", kind: "page" },
];

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (!query.trim()) return Response.json({ results: [] });

  const [posts, published] = await Promise.all([listPublishedPosts(), getPublishedChannels()]);
  const entries = [
    ...pages.map((result) => ({ result })),
    ...channels.filter(channel => channel.id === "portfolio" || published[channel.id])
      .map(({ name: title, href, description, id }) => ({
        result: { title, href, description, kind: "page" as const },
        keywords: id === "personal" && published.personal?.playlist ? ["playlist", "YouTube Music"] : [],
      })),
    ...projects.map(({ title, href, description }) => ({ result: { title, href, description, kind: "project" as const } })),
    ...posts.map((post) => ({
      result: { title: post.title, description: post.description, href: `/blog/${post.slug}`, kind: "post" as const },
      keywords: post.tags,
    })),
  ];
  return Response.json({ results: rankSearchResults(entries, query) });
}
