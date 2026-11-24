import Link from "next/link";
import {
  ArrowDown01Icon, ArrowRight01Icon, GithubIcon, InstagramIcon, Linkedin01Icon, Link01Icon, Mail01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FeaturedProject } from "@/components/featured-project";
import { HeroMotion } from "@/components/hero-motion";
import { HomeFeature } from "@/components/home-feature";
import { HomeTechnologies } from "@/components/home-technologies";
import { TextType } from "@/components/text-type";
import { buttonVariants } from "@/components/ui/button";
import { getPublishedPost } from "@/lib/posts";
import { projects, site } from "@/lib/site";

const heroTitle = ["Building for the web", "Showing the work"];

export async function PortfolioContent() {
  const initialProject = projects[0];
  const foundation = initialProject ? undefined : (await getPublishedPost("starting-point"))?.summary;
  const bio = site.bio || "I’m building CXS Portfolio to document web projects as they take shape. I write about what changed, which decisions mattered, and what still needs work.";
  const heroLine = site.bio
    ? new Intl.Segmenter("en", { granularity: "sentence" }).segment(site.bio).containing(0)?.segment.trim()
    : "I document what I build and the decisions that shape it.";
  const contactLinks = [
    { label: "Instagram", href: site.instagram, icon: InstagramIcon },
    { label: "GitHub", href: site.github, icon: GithubIcon },
    { label: "LinkedIn", href: site.linkedin, icon: Linkedin01Icon },
    { label: "Contact", href: site.contact, icon: Link01Icon },
  ].filter(({ href }) => href);

  return (
    <>
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
            <a href="#contact" className="text-link">Contact me</a>
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
              src: "/images/starting-point-crt.webp",
              alt: "The CRT television from the portfolio’s opening scene",
              aspectRatio: 16 / 9,
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
          <Link href="/blog" className="text-link">Read my devlog<HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /></Link>
        </div>
      </section>

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
            <ul className="contact-links" role="list">
              {contactLinks.map(({ label, href, icon }) => (
                <li key={label}>
                  <a href={href} className="text-link social-label">
                    <HugeiconsIcon icon={icon} size={20} aria-hidden="true" />{label}
                  </a>
                </li>
              ))}
              {!site.linkedin && (
                <li className="contact-placeholder social-label">
                  <HugeiconsIcon icon={Linkedin01Icon} size={20} aria-hidden="true" />LinkedIn · Coming soon
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
