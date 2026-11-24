"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type LogoLoop from "@/components/animations/logo-loop/LogoLoop";

const motionQuery = "(prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

type TechnologyLogo = { title: string; node: ReactNode; href?: string; hoverColor?: string };

export function TechnologyLoop({ title, logos }: { title: string; logos: TechnologyLogo[] }) {
  const animated = useSyncExternalStore(subscribe, () => window.matchMedia(motionQuery).matches, () => false);
  const content = useRef<HTMLDivElement>(null);
  const [Loop, setLoop] = useState<typeof LogoLoop>();
  const [listFocused, setListFocused] = useState(false);

  useEffect(() => {
    if (!animated || Loop || !content.current) return;

    let disposed = false;
    const load = () => {
      void import("@/components/animations/logo-loop/LogoLoop").then(({ default: Component }) => {
        if (!disposed) setLoop(() => Component);
      }).catch(() => {
        // The labeled links stay usable if the animation cannot load.
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      load();
      return () => { disposed = true; };
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      load();
    }, { rootMargin: "300px 0px" });
    observer.observe(content.current);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [animated, Loop]);

  return (
    <section className="home-technologies" aria-labelledby="technology-title">
      <h2 id="technology-title" className="site-wrap technology-heading">{title}</h2>
      <div className="technology-content" ref={content}>
        {animated && Loop && !listFocused ? (
          <Loop
            className="technology-loop"
            ariaLabel="Technology partners"
            logos={logos}
            speed={100}
            direction="right"
            logoHeight={75}
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
          <ul
            className="site-wrap technology-list"
            role="list"
            onFocus={() => setListFocused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setListFocused(false);
            }}
          >
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
