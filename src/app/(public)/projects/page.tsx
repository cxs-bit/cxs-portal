import type { Metadata } from "next";
import Link from "next/link";
import { Folder01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { buttonVariants } from "@/components/ui/button";
import { projects } from "@/lib/site";

const description = "A home for finished work and a place to follow projects as they take shape.";

export const metadata: Metadata = {
  title: "Projects",
  description,
  alternates: { canonical: "/projects" },
  openGraph: { title: "Projects", description, url: "/projects" },
};

export default function ProjectsPage() {
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
              <Link href={project.href}><h2>{project.title}</h2><p>{project.description}</p></Link>
            </li>
          ))}
        </ul>
      ) : (
        <section className="empty-panel">
          <HugeiconsIcon icon={Folder01Icon} size={24} aria-hidden="true" />
          <div>
            <h2>No projects published yet</h2>
            <p>The devlog is where I’ll share updates as work takes shape.</p>
            <Link href="/blog" className={buttonVariants({ variant: "outline" })}>Read the devlog</Link>
          </div>
        </section>
      )}
    </div>
  );
}
