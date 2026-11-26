"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Channel } from "@/lib/channel-catalog";
import CardNav, { type CardNavItem } from "./navigation/card-nav/CardNav";
import { SearchControl } from "./search-control";

const motionQuery = "(prefers-reduced-motion: no-preference)";
function subscribeMotion(update: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

const palette = {
  "--cn-panel": "var(--panel)",
  "--cn-tile": "var(--surface)",
  "--cn-muted": "var(--muted-text)",
  "--cn-text": "var(--ink)",
  "--cn-ring": "var(--highlight)",
  "--cn-cta-shadow": "none",
} as CSSProperties;

export function SiteNavigation({ channels, email, social }: {
  channels: readonly Channel[];
  email: string;
  social: { label: string; href: string };
}) {
  const pathname = usePathname();
  const motion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => false);
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const active = channels.find(channel => channel.href === pathname);
  const shop = "/?tune=" + (active?.id ?? "portfolio");
  const items: CardNavItem[] = [
    { label: "Channels", ariaLabel: "TV channels", links: channels.map(channel => ({
      label: channel.name, href: channel.href, reloadDocument: true,
      ariaCurrent: active === channel || (pathname === "/" && channel.id === "portfolio") ? "page" : undefined,
    })) },
    { label: "About", links: [
      { label: "About me", href: "/portfolio#about-title", reloadDocument: true },
      { label: "Devlog", href: "/blog", ariaCurrent: pathname === "/blog" ? "page" : pathname.startsWith("/blog/") ? "location" : undefined },
    ] },
    { label: "Projects", links: [
      { label: "Featured work", href: "/portfolio#featured-work", reloadDocument: true },
      { label: "Projects", href: "/projects", ariaCurrent: pathname === "/projects" ? "page" : undefined },
    ] },
    { label: "Contact", links: [{ label: "Email", href: "mailto:" + email }, social] },
  ];

  useEffect(() => {
    // Existing reduced-motion channel links can also arrive from another page.
    const syncFragment = () => setOpen(location.hash === "#channels");
    if (location.hash === "#channels") syncFragment();
    window.addEventListener("hashchange", syncFragment);
    window.addEventListener("popstate", syncFragment);
    return () => {
      window.removeEventListener("hashchange", syncFragment);
      window.removeEventListener("popstate", syncFragment);
    };
  }, []);

  const logo = <span className="wordmark"><span className="brand-mark" aria-hidden="true" />CXS<span className="wordmark-period">.</span></span>;
  return <header ref={header} className="site-card-nav">
    <CardNav
      logo={logo}
      logoAlt="CXS Portfolio home"
      logoHref="/"
      items={items}
      cta={{
        label: "Change channel",
        href: shop + (motion ? "" : "#channels"),
        reloadDocument: true,
        onClick: event => {
          if (motion || location.pathname !== "/" || location.hash !== "#channels") return;
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => header.current?.querySelector<HTMLElement>('[aria-label="TV channels"] a')?.focus());
        },
      }}
      cardEffect="rise"
      openOn="click"
      cardHeight={136}
      accentColor="#60b1ea"
      maxWidth={960}
      ariaLabel="Main navigation"
      open={open}
      onOpenChange={setOpen}
      linkComponent={Link}
      tools={<SearchControl onOpen={() => setOpen(false)} />}
      style={palette}
    />
    <noscript>
      <style>{".site-card-nav > .card-nav {display:none}"}</style>
      <nav aria-label="Main navigation" className="static-nav">
        <details>
          <summary>Menu</summary>
          <div id="channels" className="static-nav-links">{items.map(item =>
            <div key={item.label} role="group" aria-label={item.ariaLabel ?? item.label}>
              <strong>{item.label}</strong>
              {item.links?.map(link => <a key={link.href} href={link.href} aria-current={link.ariaCurrent}>{link.label}</a>)}
            </div>)}</div>
        </details>
        <Link href="/" aria-label="CXS Portfolio home">{logo}</Link>
        <a className="static-tune" href={shop + "#channels"}>Change channel</a>
      </nav>
    </noscript>
  </header>;
}
