import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { notFound } from "next/navigation";
import { hasOwnerSession } from "@/lib/auth";
import { isArticleAsset, slugPattern } from "@/lib/post-schema";
import { blogDirectory, getDraft } from "@/lib/posts";

export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
};

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; file: string }> }) {
  if (!(await hasOwnerSession())) notFound();
  const { slug, file } = await params;
  if (!slugPattern.test(slug) || !isArticleAsset(file) || !(await getDraft(slug))) notFound();

  const body = await readFile(join(blogDirectory, "_assets", slug, file)).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") notFound();
    throw error;
  });

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": contentTypes[extname(file).toLowerCase()],
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
