import "server-only";

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import { parse } from "yaml";
import { parsePostSummary, publishedPosts, type PostSummary } from "./post-schema";

export const blogDirectory = join(process.cwd(), "content", "blog");

const catalog = cache(async () => {
  const files = await readdir(blogDirectory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const posts = new Map<string, { summary: PostSummary; body: string }>();

  for (const file of files) {
    if (!file.isFile() || !/\.mdx$/i.test(file.name)) continue;

    const slug = file.name.slice(0, -4);
    if (posts.has(slug)) throw new Error(`Duplicate devlog slug: ${slug}`);

    const source = await readFile(join(blogDirectory, file.name), "utf8");
    const { data, content } = matter(source, { engines: { yaml: parse } });
    posts.set(slug, { summary: parsePostSummary(slug, data), body: content });
  }

  return posts;
});

export const listPublishedPosts = cache(async () =>
  publishedPosts(Array.from((await catalog()).values(), ({ summary }) => summary)),
);

export const getPublishedPost = cache(async (slug: string) => {
  const post = (await catalog()).get(slug);
  return post?.summary.status === "published" ? post : undefined;
});

export async function listDrafts() {
  return Array.from((await catalog()).values(), ({ summary }) => summary)
    .filter((post) => post.status === "draft")
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export async function getDraft(slug: string) {
  const post = (await catalog()).get(slug);
  return post?.summary.status === "draft" ? post : undefined;
}
