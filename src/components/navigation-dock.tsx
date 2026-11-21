"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PillNav, { type PillNavItem } from "./navigation/pill-nav/PillNav";
import { SearchControl } from "./search-control";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Devlog" },
];

const pillStyle = {
  "--pn-h": "44px",
  "--pn-inner": "44px",
  "--pn-pad": "0px",
  "--pn-x": "var(--dock-pill-padding)",
  "--pn-font": ".875rem",
  "--pn-mark": "1.125rem",
  "--pn-text": "var(--muted-text)",
  "--pn-strong": "var(--ink)",
  "--pn-tile": "var(--surface)",
  "--pn-tile-rim": "none",
  "--pn-pill-shadow": "none",
  "--pn-ring": "var(--ring)",
} as CSSProperties;

export function NavigationDock() {
  const pathname = usePathname();
  const items: PillNavItem[] = links.map((item) => ({
    ...item,
    ariaCurrent: pathname === item.href ? "page" : "location",
  }));
  const activeHref = links.find(({ href }) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)))?.href ?? "";

  return (
    <header className="site-dock">
      <PillNav
        logo={<span className="brand-mark" aria-hidden="true" />}
        logoAlt="CXS Portfolio home"
        logoHref="/"
        items={items}
        activeHref={activeHref}
        linkComponent={Link}
        ariaLabel="Main navigation"
        className="dock-pill-nav"
        itemStyle="pill"
        hoverEffect="glide"
        indicator="pill"
        layout="joined"
        size="lg"
        surface="none"
        collapse="never"
        intro={false}
        highlightColor="var(--primary)"
        highlightTextColor="var(--primary-foreground)"
        style={pillStyle}
      />
      <div className="dock-tools">
        <SearchControl />
      </div>
    </header>
  );
}
