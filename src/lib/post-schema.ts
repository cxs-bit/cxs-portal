import { z } from "zod";

const assetName = /^[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g|avif)$/i;

export function isArticleAsset(file: string) {
  return assetName.test(file);
}

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const postSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.union([z.iso.date(), z.date()]).transform((date) =>
    typeof date === "string" ? date : date.toISOString().slice(0, 10),
  ),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export type PostSummary = z.output<typeof postSchema> & { slug: string };

export function parsePostSummary(slug: string, data: unknown): PostSummary {
  if (!slugPattern.test(slug)) {
    throw new Error(`Invalid devlog slug: ${slug}`);
  }
  const post = postSchema.safeParse(data);
  if (!post.success) {
    throw new Error(`Invalid frontmatter in ${slug}.mdx: ${post.error.message}`);
  }
  return { slug, ...post.data };
}

export function publishedPosts(posts: PostSummary[]) {
  return posts
    .filter((post) => post.status === "published")
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(date));
}
