"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import LogoLoop from "@/components/animations/logo-loop/LogoLoop";

const motionQuery = "(prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

type TechnologyLogo = { title: string; node: ReactNode; href?: string; hoverColor?: string };

export function TechnologyLoop({ title, logos }: { title: string; logos: TechnologyLogo[] }) {
  const animated = useSyncExternalStore(subscribe, () => window.matchMedia(motionQuery).matches, () => false);

  return (
    <section className="site-wrap home-technologies" aria-labelledby="technology-title">
      <h2 id="technology-title" className="technology-heading">{title}</h2>
      <div className="technology-window">
        {animated ? (
          <LogoLoop
            className="technology-loop"
            ariaLabel="Technology partners"
            logos={logos}
            speed={100}
            direction="right"
            logoHeight={50}
            gap={56}
            hoverSpeed={20}
            scaleOnHover={false}
            layout="arc"
            bend={0.6}
            magnify={0}
            labels="hover"
            muted={0}
            fadeOut
            fadeOutWidth={0.12}
          />
        ) : (
          <ul className="technology-list" role="list">
            {logos.map(({ title, node, href }) => (
              <li key={title}>
                {href ? <a href={href}>{node}{title}</a> : <>{node}{title}</>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
