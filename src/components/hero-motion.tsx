"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HeroMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine)");
    let cleanup: (() => void) | undefined;
    let generation = 0;

    async function start() {
      const current = ++generation;
      cleanup?.();
      cleanup = undefined;
      if (!hero || !motion.matches || !desktop.matches) return;

      const { gsap } = await import("gsap");
      if (current !== generation) return;

      const context = gsap.context(() => {
        gsap.from("[data-hero-enter]", { y: 12, duration: 0.55, stagger: 0.05, ease: "power2.out", clearProps: "transform" });
      }, hero);
      cleanup = () => context.revert();
    }

    function update() {
      void start().catch(() => {});
    }

    update();
    motion.addEventListener("change", update);
    desktop.addEventListener("change", update);
    return () => {
      generation++;
      cleanup?.();
      motion.removeEventListener("change", update);
      desktop.removeEventListener("change", update);
    };
  }, []);

  return <section ref={ref} className="hero" aria-labelledby="hero-title">{children}</section>;
}
