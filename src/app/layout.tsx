import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/figtree";
import "./globals.css";
import { Header } from "@/components/header";
import { PointerSpotlight } from "@/components/cursor/PointerSpotlight";
import { SiteBackground } from "@/components/site-background";
import { Theme } from "@/components/theme";
import { indexable, site, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: site.title, template: `%s · ${site.title}` },
  description: site.description,
  robots: { index: indexable, follow: indexable },
  openGraph: { type: "website", siteName: site.title, title: site.title, description: site.description },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Theme>
          <SiteBackground />
          <PointerSpotlight />
          <div id="portfolio-page">
            <a href="#main" className="skip-link">Skip to content</a>
            <Header />
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
                  {site.github && <a href={site.github}>GitHub</a>}
                  {site.contact && <a href={site.contact}>Contact</a>}
                </nav>
              </div>
            </footer>
          </div>
        </Theme>
      </body>
    </html>
  );
}
