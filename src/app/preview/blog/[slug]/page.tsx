import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Article } from "@/components/article";
import { hasOwnerSession } from "@/lib/auth";
import { getDraft } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

export default async function DraftPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await hasOwnerSession())) redirect("/preview");
  const post = await getDraft((await params).slug);
  if (!post) notFound();
  return <Article post={post} preview />;
}
