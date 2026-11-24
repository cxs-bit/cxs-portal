import type { Metadata } from "next";
import { PostList } from "@/components/post-list";
import { listPublishedPosts } from "@/lib/posts";
import { portfolioShareImage, site } from "@/lib/site";

const description = "Project updates and technical notes on building for the web.";

export const metadata: Metadata = {
  title: "Devlog",
  description,
  alternates: { canonical: "/blog" },
  openGraph: { type: "website", title: "Devlog", description, url: "/blog", siteName: site.title, images: [portfolioShareImage] },
};

export default async function BlogPage() {
  return (
    <div className="site-wrap content-page archive-page">
      <header className="page-heading">
        <h1>Devlog<span>.</span></h1>
        <p>{description}</p>
      </header>
      <section className="archive" aria-labelledby="archive-heading">
        <h2 id="archive-heading" className="sr-only">All entries</h2>
        <PostList posts={await listPublishedPosts()} />
      </section>
    </div>
  );
}
