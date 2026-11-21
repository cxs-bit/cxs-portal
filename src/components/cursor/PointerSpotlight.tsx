"use client";

import { useEffect, useRef } from "react";
import "./PointerSpotlight.css";

const enabledQuery = "(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)";
const buttonSelector = ":is(button, .spotlight-button):not(:disabled, [aria-disabled=true])";
const radius = 145.6;

export function PointerSpotlight() {
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const halo = haloRef.current;
    if (!halo) return;

    const media = window.matchMedia(enabledQuery);
    const listeners = new AbortController();
    const options = { passive: true, signal: listeners.signal };
    let pointer: { x: number; y: number } | undefined;
    let frame = 0;
    let lit = new Set<HTMLElement>();

    function clearButton(button: HTMLElement) {
      button.removeAttribute("data-spotlight");
      button.style.removeProperty("--spotlight-x");
      button.style.removeProperty("--spotlight-y");
    }

    function hide() {
      pointer = undefined;
      cancelAnimationFrame(frame);
      frame = 0;
      if (halo) halo.hidden = true;
      lit.forEach(clearButton);
      lit.clear();
    }

    function render() {
      frame = 0;
      if (!halo || !pointer) return;
      const { x, y } = pointer;
      const nearby = [];
      for (const button of document.querySelectorAll<HTMLElement>(buttonSelector)) {
        if (button.closest("[inert], [aria-hidden=true]")) continue;
        const bounds = button.getBoundingClientRect();
        if (!bounds.width || !bounds.height) continue;
        const dx = Math.max(bounds.left - x, 0, x - bounds.right);
        const dy = Math.max(bounds.top - y, 0, y - bounds.bottom);
        if (Math.hypot(dx, dy) < radius) nearby.push({ button, bounds });
      }

      halo.style.setProperty("--light-x", `${x}px`);
      halo.style.setProperty("--light-y", `${y}px`);
      halo.hidden = false;
      const next = new Set<HTMLElement>();
      for (const { button, bounds } of nearby) {
        button.style.setProperty("--spotlight-x", `${x - bounds.left}px`);
        button.style.setProperty("--spotlight-y", `${y - bounds.top}px`);
        button.setAttribute("data-spotlight", "");
        next.add(button);
      }
      for (const button of lit) {
        if (!next.has(button)) clearButton(button);
      }
      lit = next;
    }

    function schedule() {
      if (pointer && !frame) frame = requestAnimationFrame(render);
    }

    function track(event: PointerEvent) {
      if (!media.matches || event.pointerType === "touch") {
        hide();
        return;
      }
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    }

    window.addEventListener("pointermove", track, options);
    window.addEventListener("pointerdown", track, options);
    window.addEventListener("scroll", schedule, { ...options, capture: true });
    window.addEventListener("resize", schedule, options);
    window.addEventListener("blur", hide, options);
    window.addEventListener("keydown", hide, options);
    document.documentElement.addEventListener("pointerleave", hide, options);
    media.addEventListener("change", hide, options);
    return () => {
      listeners.abort();
      hide();
    };
  }, []);

  return <div className="pointer-spotlight" ref={haloRef} hidden aria-hidden="true" />;
}
