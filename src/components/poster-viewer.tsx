"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { WallPoster } from "@/lib/wall-posters";

function Artwork({ poster }: { poster: WallPoster }) {
  const [failed, setFailed] = useState<string>();
  if (poster.image && poster.image !== failed) {
    // Wall artwork includes remote playlist thumbnails and local SVG marks.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster.image} alt={poster.title} draggable={false} onError={() => setFailed(poster.image)} />;
  }
  return <span className="viewer-initials" aria-hidden="true">
    {poster.title.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join("")}
  </span>;
}

type ViewerProps = {
  channel: string;
  posters: readonly WallPoster[];
  index: number;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function PosterViewer({ channel, posters, index, onSelect, onClose }: ViewerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const count = posters.length;
  const active = posters[index];
  const previous = count > 2 || index > 0 ? posters[(index - 1 + count) % count] : undefined;
  const next = count > 2 || index < count - 1 ? posters[(index + 1) % count] : undefined;

  useLayoutEffect(() => {
    const element = dialog.current!;
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => element.close();
  }, []);

  async function dismiss() {
    const element = dialog.current;
    if (!element || closing.current) return;
    closing.current = true;
    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      const exit = element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-out", fill: "forwards" });
      await exit.finished.catch(() => {});
    }
    if (element.isConnected) {
      element.close();
      onClose();
    }
  }

  return <dialog ref={dialog} className="poster-viewer" aria-label="Poster viewer" data-lenis-prevent
    onCancel={event => { event.preventDefault(); void dismiss(); }}
    onKeyDown={event => {
      event.stopPropagation();
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const target = event.key === "ArrowLeft" ? previous : next;
        if (target && !closing.current) onSelect(target.id);
      }
    }}>
    <header className="viewer-toolbar">
      <span><strong>{channel}</strong> poster wall</span>
      <button ref={closeButton} type="button" aria-label="Close poster viewer" onClick={() => void dismiss()}>
        <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden="true" />
      </button>
    </header>
    <div className="viewer-scroll">
      <figure className="viewer-spread" data-single={count === 1}>
        <div className="viewer-panels" data-kind={active.kind}>
          {[previous, active, next].map((poster, slot) => poster && <div
            key={poster.id} className="viewer-panel" data-slot={slot} data-kind={poster.kind} aria-hidden={slot !== 1}>
            <Artwork poster={poster} />
          </div>)}
          {([previous, next] as const).map((target, side) => target && <button type="button"
            className="viewer-step" key={count === 2 ? "other" : side} data-side={side} aria-label={side ? "Next poster" : "Previous poster"}
            title={target.title} onClick={() => { if (!closing.current) onSelect(target.id); }}>
            <span><HugeiconsIcon icon={side ? ArrowRight01Icon : ArrowLeft01Icon} size={22} aria-hidden="true" /></span>
          </button>)}
        </div>
        <figcaption aria-live="polite" aria-atomic="true">
          <div className="viewer-caption-heading"><h2>{active.title}</h2><span>{index + 1} / {count}</span></div>
          {active.description && <p>{active.description}</p>}
        </figcaption>
      </figure>
    </div>
  </dialog>;
}
