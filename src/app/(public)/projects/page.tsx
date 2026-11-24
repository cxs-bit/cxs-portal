import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Folder01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { buttonVariants } from "@/components/ui/button";
import { listPublishedPosts } from "@/lib/posts";
import { projects, site, siteUrl } from "@/lib/site";

const description = "Software projects and notes on how they’re built.";
const featured = projects.find(project => project.demo);

export const metadata: Metadata = {
  title: "Projects",
  description,
  alternates: { canonical: "/projects" },
  openGraph: {
    type: "website", siteName: site.title, url: "/projects",
    title: featured ? `${featured.title} demo · CXS Projects` : "Projects",
    description: featured?.demo?.description ?? description,
    videos: featured?.demo && [{ url: new URL(featured.demo.src, siteUrl), type: "video/mp4", width: 1920, height: 1080 }],
  },
};

export default async function ProjectsPage() {
  const [latestNote] = projects.length ? [] : await listPublishedPosts();

  return (
    <div className="site-wrap content-page">
      <header className="page-heading">
        <h1>Projects<span>.</span></h1>
        <p>{description}</p>
      </header>
      {projects.length ? (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.href}>
              <div className="project-intro">
                <div><h2>{project.title}</h2><p>{project.description}</p></div>
                <a className="text-link" href={project.href}>Visit {project.title}</a>
              </div>
              {project.demo && (
                <figure className="project-demo">
                  <video
                    id={project.demo.id}
                    aria-label={project.title + " demo"}
                    aria-describedby={project.demo.id + "-caption"}
                    controls
                    playsInline
                    preload="none"
                    poster={project.demo.poster}
                    src={project.demo.src}
                    width={1920}
                    height={1080}
                  >
                    <a href={project.demo.src}>Open the {project.title} video</a>
                  </video>
                  <figcaption id={project.demo.id + "-caption"}>{project.demo.description}</figcaption>
                </figure>
              )}
              {project.gallery && (
                <div className="project-gallery">
                  {project.gallery.map(({ src, alt, caption, width, height }, index) => (
                    <figure key={src}>
                      <a href={src}>
                        <Image src={src} alt={alt} width={width} height={height}
                          sizes={index === 0 ? "(max-width: 90rem) 89vw, 80rem" : "(max-width: 48rem) 89vw, (max-width: 90rem) 44vw, 40rem"} />
                      </a>
                      <figcaption>{caption}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <section className="empty-panel">
          <HugeiconsIcon icon={Folder01Icon} size={24} aria-hidden="true" />
          <div>
            <h2>No projects published yet</h2>
            {latestNote ? (
              <>
                <p>Follow the work in the latest published build note.</p>
                <div className="project-discovery-links">
                  <Link href={`/blog/${latestNote.slug}`} className={buttonVariants()}>{latestNote.title}</Link>
                  <Link href="/blog" className="text-link">Read the devlog</Link>
                </div>
              </>
            ) : (
              <>
                <p>The devlog is where I’ll share updates as work takes shape.</p>
                <Link href="/blog" className={buttonVariants({ variant: "outline" })}>Read the devlog</Link>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
