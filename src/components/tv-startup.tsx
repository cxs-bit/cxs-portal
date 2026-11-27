import { tvSessionKey } from "@/lib/tv-session";

// This small, inline controller works while the homepage's React and WebGL
// bundles are still in flight. The native dialog handles focus and modality.
const bootstrap = (channelIds: readonly string[]) => `(() => {
  const dialog = document.getElementById("tv-startup");
  const skip = dialog.querySelector("a");
  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  let showTimer, deadline, revealTimer, startedAt, skipped = false;
  function close() {
    clearTimeout(showTimer);
    clearTimeout(deadline);
    clearTimeout(revealTimer);
    if (dialog.open) dialog.close();
    delete dialog.dataset.phase;
  }
  function fallback() {
    skipped = true;
    const url = new URL(location.href);
    if (url.pathname === "/" && url.searchParams.has("tune")) {
      url.searchParams.delete("tune");
      history.replaceState(history.state, "", url);
    }
    try { sessionStorage.setItem(${JSON.stringify(tvSessionKey)}, "1"); } catch {}
    close();
    window.dispatchEvent(new Event("tv-startup-skip"));
    const focusMain = () => document.getElementById("main")?.focus({ preventScroll: true });
    if (document.getElementById("main")) focusMain();
    else document.addEventListener("DOMContentLoaded", focusMain, { once: true });
  }
  function start() {
    if (dialog.open || skipped || location.pathname !== "/" || location.hash || !motion.matches) return;
    const tune = new URLSearchParams(location.search).get("tune");
    if (!${JSON.stringify(channelIds)}.includes(tune)) {
      try { if (sessionStorage.getItem(${JSON.stringify(tvSessionKey)}) === "1") return; } catch {}
    }
    startedAt = performance.now();
    dialog.showModal();
    showTimer = setTimeout(() => { dialog.dataset.phase = "waiting"; }, 300);
    deadline = setTimeout(fallback, 10000);
  }
  function ready(onReveal) {
    if (dialog.open && performance.now() - startedAt >= 10000) { fallback(); return; }
    clearTimeout(showTimer);
    clearTimeout(deadline);
    const reveal = () => {
      const keepSkip = dialog.open && document.activeElement === skip;
      close();
      onReveal(keepSkip);
    };
    if (dialog.open && dialog.dataset.phase === "waiting") {
      dialog.dataset.phase = "revealing";
      revealTimer = setTimeout(reveal, 200);
    } else {
      reveal();
    }
  }
  dialog.addEventListener("cancel", event => { event.preventDefault(); fallback(); });
  skip.addEventListener("click", event => { event.preventDefault(); fallback(); });
  motion.addEventListener("change", () => { if (dialog.open && !motion.matches) fallback(); });
  window.cxsTvStartup = { start, ready, close, fallback, get skipped() { return skipped; } };
  start();
})();`;

declare global {
  interface Window {
    cxsTvStartup?: {
      start(): void;
      ready(onReveal: (keepSkip: boolean) => void): void;
      close(): void;
      fallback(): void;
      readonly skipped: boolean;
    };
  }
}

export function TvStartup({ channels }: { channels: readonly string[] }) {
  return <>
    <dialog id="tv-startup" aria-label="Opening TV room" suppressHydrationWarning>
      <div className="tv-startup-signal">
        <span className="tv-startup-line" aria-hidden="true" />
        <p role="status">Tuning in…</p>
      </div>
      <a className="tv-startup-skip" href="#main">Skip to portfolio</a>
    </dialog>
    <script dangerouslySetInnerHTML={{ __html: bootstrap(channels) }} />
  </>;
}
