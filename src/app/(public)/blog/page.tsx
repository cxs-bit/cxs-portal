import type { Metadata } from "next";
import { PostList } from "@/components/post-list";
import { listPublishedPosts } from "@/lib/posts";

const description = "Project updates and technical notes on building for the web.";

export const metadata: Metadata = {
  title: "Devlog",
  description,
  alternates: { canonical: "/blog" },
  openGraph: { title: "Devlog", description, url: "/blog" },
};

export default async function BlogPage() {
  return (
    <div className="site-wrap content-page">
      <header className="page-heading">
        <h1>Devlog<span>.</span></h1>
        <p>{description}</p>
      </header>
      <section className="archive" aria-labelledby="archive-heading">
        <h2 id="archive-heading" className="eyebrow section-kicker">All entries</h2>
        <PostList posts={await listPublishedPosts()} />
      </section>
    </div>
  );
}
