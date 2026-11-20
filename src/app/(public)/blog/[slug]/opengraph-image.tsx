import { notFound } from "next/navigation";
import { getPublishedPost } from "@/lib/posts";
import { socialCard, socialSize } from "@/lib/social-card";

export const alt = "CXS Devlog";
export const size = socialSize;
export const contentType = "image/png";

export default async function PostImage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPublishedPost((await params).slug);
  if (!post) notFound();
  return socialCard(post.summary.title, "Devlog");
}
