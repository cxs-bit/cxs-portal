"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchControl } from "./search-control";
import { ThemeControl } from "./theme";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Devlog" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-wrap header-inner">
        <Link href="/" className="wordmark" aria-label="CXS Portfolio home">
          <span className="brand-mark" aria-hidden="true" /> CXS<span className="wordmark-period">.</span>
        </Link>
        <nav aria-label="Main navigation" className="main-nav">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <SearchControl />
          <ThemeControl />
        </div>
      </div>
    </header>
  );
}
