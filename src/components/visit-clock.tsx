"use client";

import { useEffect, useState } from "react";

export function visitStart() {
  let start = performance.timeOrigin;
  try {
    const stored = sessionStorage.getItem("cxs-shop-arrival");
    if (stored && Number(stored) > 0 && Number(stored) <= start) start = Number(stored);
    else sessionStorage.setItem("cxs-shop-arrival", String(start));
  } catch { /* The document clock also works with storage disabled. */ }
  return start;
}

export function VisitClock() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = visitStart();
    const update = () => setSeconds(Math.floor((Date.now() - start) / 1000));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const value = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(part => String(part).padStart(2, "0")).join(":");
  return <span className="tv-time" role="timer" aria-label="Elapsed visit time">{value}</span>;
}
