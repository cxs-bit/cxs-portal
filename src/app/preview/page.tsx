import Link from "next/link";
import type { Metadata } from "next";
import { PostList } from "@/components/post-list";
import { Button } from "@/components/ui/button";
import { hasOwnerSession, previewAuth } from "@/lib/auth";
import { listDrafts } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };

export default async function PreviewPage() {
  const authenticated = await hasOwnerSession();

  return (
    <div className="site-wrap content-page">
      <header className="page-heading">
        <h1>Draft preview<span>.</span></h1>
        <p>{authenticated ? "Unpublished devlog entries." : "Sign in with the portfolio owner’s GitHub account."}</p>
      </header>
      {authenticated ? (
        <>
          <Link className="text-link" href="/?tune=portfolio">Open the TV shop with draft channels</Link>
          <PostList posts={await listDrafts()} preview />
          <form className="preview-form" action={async () => {
            "use server";
            await previewAuth().signOut({ redirectTo: "/preview" });
          }}>
            <Button type="submit" variant="outline">Sign out</Button>
          </form>
        </>
      ) : (
        <form action={async () => {
          "use server";
          await previewAuth().signIn("github", { redirectTo: "/preview" });
        }}>
          <Button type="submit">Sign in with GitHub</Button>
        </form>
      )}
    </div>
  );
}
