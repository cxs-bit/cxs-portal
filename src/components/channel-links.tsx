"use client";

import { useEffect, useSyncExternalStore } from "react";
import { visitStart } from "./visit-clock";
import type { Channel } from "@/lib/channel-catalog";

const query = "(prefers-reduced-motion: no-preference)";
function subscribe(update: () => void) {
  const preference = window.matchMedia(query);
  preference.addEventListener("change", update);
  return () => preference.removeEventListener("change", update);
}

export function ChannelLinks({ active, available, inShop = false }: {
  active: Channel;
  available: readonly Channel[];
  inShop?: boolean;
}) {
  useEffect(() => {
    visitStart();
    // Some browsers resolve the fragment before the streamed channel has rendered.
    if (!location.hash || window.scrollY !== 0) return;
    const frame = requestAnimationFrame(() => {
      if (window.scrollY === 0) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const motion = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
  const shop = "/?tune=" + active.id + (motion ? "" : "#channels");
  return (
    <nav id="channels" className="site-wrap channel-links" aria-label="TV channels">
      {inShop ? <span className="channel-nav-label">Channels</span> : (
        <a className="channel-return" href={shop}>Change channel</a>
      )}
      <div className="channel-options">
        {available.map(channel => (
          <a key={channel.id} href={channel.href} aria-current={active.id === channel.id ? "page" : undefined}>
            {channel.name}
          </a>
        ))}
      </div>
    </nav>
  );
}
