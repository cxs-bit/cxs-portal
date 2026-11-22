import type { Metadata } from "next";
import { ArrowDown01Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrtIntro } from "@/components/crt-intro";
import { FeaturedProject } from "@/components/featured-project";
import { HeroMotion } from "@/components/hero-motion";
import { HomeFeature } from "@/components/home-feature";
import { HomeTechnologies } from "@/components/home-technologies";
import { TextType } from "@/components/text-type";
import { buttonVariants } from "@/components/ui/button";
import { getPublishedPost } from "@/lib/posts";
import { projects, site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/", title: site.title, description: site.description, siteName: site.title },
};

const heroTitle = ["Building for the web", "Showing the work"];

export default async function HomePage() {
  const initialProject = projects[0];
  const foundation = initialProject ? undefined : (await getPublishedPost("starting-point"))?.summary;
  const bio = site.bio || "I’m building CXS Portfolio to document web projects as they take shape. I write about what changed, which decisions mattered, and what still needs work.";
  const heroLine = site.bio
    ? new Intl.Segmenter("en", { granularity: "sentence" }).segment(site.bio).containing(0)?.segment.trim()
    : "I document what I build and the decisions that shape it.";
  const contactLinks = [
    { label: "LinkedIn", href: site.linkedin },
    { label: "Instagram", href: site.instagram },
    { label: "GitHub", href: site.github },
    { label: "Contact", href: site.contact },
  ].filter(({ href }) => href);
  const hasContact = Boolean(site.email || contactLinks.length);

  return (
    <>
      <CrtIntro />
      <HeroMotion>
        <div className="site-wrap hero-copy">
          <h1 id="hero-title" data-hero-enter>
            <span className="sr-only">{heroTitle.join(" ")}</span>
            <TextType
              text={heroTitle}
              typingSpeed={75}
              pauseDuration={1500}
              deletingSpeed={50}
              mistakes={0.4}
              variableSpeed={{ min: 60, max: 120 }}
            />
          </h1>
          <p className="hero-description" data-hero-enter>{heroLine}</p>
          <div className="home-actions" data-hero-enter>
            <a href="#featured-work" className={buttonVariants({ size: "lg" })}>
              Explore the work<HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
            </a>
            {hasContact && <a href="#contact" className="text-link">Contact me</a>}
          </div>
        </div>
      </HeroMotion>

      {initialProject ? <FeaturedProject initial={initialProject} projects={projects} /> : foundation ? (
        <HomeFeature
          item={{
            title: foundation.title,
            description: foundation.description,
            href: `/blog/${foundation.slug}`,
            screenshot: {
              src: "/images/rally-dashboard.png",
              alt: "Rally Educativo Ecológico dashboard showing teams, stations, and scores",
              aspectRatio: 1907 / 930,
            },
          }}
          action="Read the build note"
        />
      ) : (
        <HomeFeature
          item={{ title: "Projects", description: "I’ll share projects here as they’re ready to explore.", href: "/projects" }}
          action="Browse all projects"
        />
      )}

      <HomeTechnologies skills={site.skills} />

      <section className="site-wrap home-details" aria-labelledby="about-title">
        <h2 id="about-title">About me</h2>
        <div className="home-details-copy">
          {site.name && <p className="about-name">{site.name}</p>}
          <p>{bio}</p>
        </div>
      </section>

      {hasContact && (
        <section id="contact" className="site-wrap home-details" aria-labelledby="contact-title" tabIndex={-1}>
          <h2 id="contact-title">Contact me</h2>
          <div className="home-details-copy">
            <p>Have a project in mind or something you’d like to talk through? I’d like to hear from you.</p>
            <div className="home-actions">
              {site.email && (
                <a href={`mailto:${site.email}`} className={buttonVariants({ size: "lg" })}>
                  <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />Email me
                </a>
              )}
              {contactLinks.map(({ label, href }) => <a key={label} href={href} className="text-link">{label}</a>)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
