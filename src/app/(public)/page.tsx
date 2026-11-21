import type { Metadata } from "next";
import Link from "next/link";
import { HeroMotion } from "@/components/hero-motion";
import { CrtIntro } from "@/components/crt-intro";
import { PostList } from "@/components/post-list";
import { buttonVariants } from "@/components/ui/button";
import { listPublishedPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", title: site.title, description: site.description, siteName: site.title },
};

export default async function HomePage() {
  const posts = (await listPublishedPosts()).slice(0, 3);

  return (
    <>
      <CrtIntro />
      <HeroMotion>
        <div className="site-wrap hero-inner">
          <div className="hero-copy" data-scroll-fade>
            <h1 id="hero-title" data-hero-enter>Building<br />for the web<span>.</span></h1>
            <div className="hero-intro" data-hero-enter>
              {site.name && <p className="hero-name">{site.name}</p>}
              <p className="hero-description">
                {site.bio || "A place for my projects, technical notes, and the decisions behind what I build."}
              </p>
            </div>
            <div className="hero-actions" data-hero-enter>
              <Link href="/blog" className={buttonVariants()}>Read the devlog</Link>
              <Link href="/projects" className={buttonVariants({ variant: "outline" })}>Browse projects</Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true" />
        </div>
      </HeroMotion>

      <section className="site-wrap editorial-section" data-scroll-fade>
        <div className="section-intro">
          <div>
            <p className="eyebrow section-kicker">Devlog</p>
            <h2>Latest writing</h2>
          </div>
          <Link href="/blog" className="text-link">View all entries</Link>
        </div>
        <PostList posts={posts} />
      </section>

      <section className="stack-section">
        <div className="site-wrap stack-inner" data-scroll-fade>
          <div>
            <p className="eyebrow section-kicker">{site.skills.length ? "Skills" : "Under the hood"}</p>
            <h2>{site.skills.length ? "What I work with" : "Built with"}</h2>
          </div>
          <ul className="stack-list" aria-label={site.skills.length ? "Skills" : "Technologies used for this site"}>
            {(site.skills.length ? site.skills : ["TypeScript", "Next.js", "Tailwind CSS", "GSAP", "MDX"]).map((skill) => <li key={skill}>{skill}</li>)}
          </ul>
        </div>
      </section>
    </>
  );
}
