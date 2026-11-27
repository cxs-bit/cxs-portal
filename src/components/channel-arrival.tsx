"use client";

import { useEffect } from "react";
import { channels } from "@/lib/channel-catalog";
import { rememberChannelVisit } from "@/lib/tv-session";
import { visitStart } from "./visit-clock";

export function ChannelArrival() {
  useEffect(() => {
    visitStart();
    if (channels.some(channel => channel.href === location.pathname)) rememberChannelVisit();
    // Some browsers resolve the fragment before the streamed channel has rendered.
    if (!location.hash || window.scrollY !== 0) return;
    const frame = requestAnimationFrame(() => {
      if (window.scrollY === 0) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}
