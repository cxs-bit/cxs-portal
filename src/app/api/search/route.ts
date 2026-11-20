import type { SearchResult } from "@/generated/portfolio";
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

  const posts = await listPublishedPosts();
  const entries = [
    ...pages.map((result) => ({ result })),
    ...projects.map((project) => ({ result: { ...project, kind: "project" as const } })),
    ...posts.map((post) => ({
      result: { title: post.title, description: post.description, href: `/blog/${post.slug}`, kind: "post" as const },
      keywords: post.tags,
    })),
  ];
  return Response.json({ results: rankSearchResults(entries, query) });
}
