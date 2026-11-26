import type { Metadata } from "next";
import Link from "next/link";
import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@fontsource-variable/figtree";
import "./globals.css";
import { SiteNavigation } from "@/components/site-navigation";
import { channels } from "@/lib/channel-catalog";
import { getVisibleChannels } from "@/lib/channels";
import { PointerSpotlight } from "@/components/cursor/PointerSpotlight";
import { SiteBackground } from "@/components/site-background";
import { indexable, site, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: site.title, template: `%s · ${site.title}` },
  description: site.description,
  robots: { index: indexable, follow: indexable },
  openGraph: { type: "website", siteName: site.title, title: site.title, description: site.description },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const visible = await getVisibleChannels();
  const available = channels.filter(channel => channel.id === "portfolio" || visible[channel.id]);
  return (
    <html lang="en" className="dark">
      <body>
        <SiteBackground />
        <PointerSpotlight />
        <div id="portfolio-page">
          <a href="#main" className="skip-link">Skip to content</a>
          <SiteNavigation channels={available} email={site.email} social={site.linkedin ? { label: "LinkedIn", href: site.linkedin } : { label: "GitHub", href: site.github }} />
          <main id="main" tabIndex={-1}>{children}</main>
          <footer className="site-footer">
            <div className="site-wrap footer-inner">
              <Link href="/" className="wordmark" aria-label="CXS Portfolio home">
                <span className="brand-mark" aria-hidden="true" /> CXS<span className="wordmark-period">.</span>
              </Link>
              {site.name && <span>{site.name}</span>}
              <nav aria-label="Footer navigation">
                <Link href="/projects">Projects</Link>
                <Link href="/blog">Devlog</Link>
                {site.github && (
                  <a href={site.github} className="social-label">
                    <HugeiconsIcon icon={GithubIcon} size={16} aria-hidden="true" />GitHub
                  </a>
                )}
                {site.contact && <a href={site.contact}>Contact</a>}
              </nav>
            </div>
          </footer>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
