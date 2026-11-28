"use client";

import { useEffect, useState, type RefObject } from "react";
import { posterStaggerMs, type WallPoster } from "@/lib/wall-posters";

export function useMusicPosters(active: boolean) {
  const [posters, setPosters] = useState<WallPoster[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    let checking = false;
    async function refresh() {
      if (checking || document.hidden) return;
      checking = true;
      try {
        const result = await fetch("/api/tv/artwork", { signal: controller.signal, cache: "no-store" });
        if (!result.ok) throw new Error("Playlist unavailable");
        const data: { posters: WallPoster[] } = await result.json();
        if (controller.signal.aborted) return;
        setPosters(data.posters);
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) setStatus("unavailable");
      } finally {
        checking = false;
      }
    }
    void refresh();
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [active]);
  return { posters, status };
}

const types: Record<WallPoster["kind"], string> = {
  project: "Project screenshot", technology: "Tech stack", portrait: "Portrait", track: "Track", playlist: "Playlist",
};

export function PosterInfo({ poster }: { poster: WallPoster }) {
  return <div className="tv-poster-info">
    <span>{poster.source ?? types[poster.kind]}</span>
    <strong>{poster.title}</strong>
    {poster.description && <p>{poster.description}</p>}
  </div>;
}

type GalleryProps = {
  channel: string;
  posters: readonly WallPoster[];
  selected: string | null;
  emptyMessage: string;
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onPreview: (id: string | null) => void;
  onOpen: (id: string, opener: HTMLButtonElement) => void;
};

export function PosterWall({ channel, posters, selected, emptyMessage, closeRef, onClose, onPreview, onOpen }: GalleryProps) {
  return <section className="poster-gallery" aria-label={channel + " poster wall"} data-lenis-prevent>
    <header>
      <h2>{channel} <span>poster wall</span></h2>
      <button ref={closeRef} type="button" onClick={onClose}>Back to TV</button>
    </header>
    {posters.length > 0 && !selected && <p className="poster-wall-hint">Select a poster to open it full screen.</p>}
    <div className="poster-wall-scroll" data-lenis-prevent>
      {posters.length ? <ul className="poster-wall-grid">
        {posters.map((poster, index) => <li key={poster.id} style={{ animationDelay: `${index * posterStaggerMs}ms` }}>
          <button type="button" aria-label={poster.title} aria-pressed={poster.id === selected}
            className="wall-print" data-kind={poster.kind}
            onPointerEnter={e => { if (e.pointerType === "mouse") onPreview(poster.id); }}
            onPointerLeave={e => { if (e.pointerType === "mouse" && !e.currentTarget.matches(":focus-visible")) onPreview(null); }}
            onFocus={e => { if (e.currentTarget.matches(":focus-visible")) onPreview(poster.id); }}
            onBlur={() => onPreview(null)}
            onClick={e => onOpen(poster.id, e.currentTarget)}>
            {poster.image ? <span className="wall-print-image" style={{backgroundImage: `url("${encodeURI(poster.image).replaceAll('"', '%22')}")`}} />
              : <span className="wall-print-initials" aria-hidden="true">{poster.title.split(/\s+/).slice(0, 2).map(word => word[0]).join("")}</span>}
            <span className="wall-print-title">{poster.title}</span>
          </button>
        </li>)}
      </ul> : <p className="poster-wall-empty">{emptyMessage}</p>}
    </div>
  </section>;
}
