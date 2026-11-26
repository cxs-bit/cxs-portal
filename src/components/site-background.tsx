"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const CRTWarp = dynamic(() => import("./backgrounds/CRTWarp"), { ssr: false });
const motionQuery = "(prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function SiteBackground() {
  const pathname = usePathname();
  const reading = pathname === "/blog" || pathname.startsWith("/blog/");
  const motionAllowed = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  );

  return (
    <div className="site-crt" aria-hidden="true">
      {motionAllowed && !reading && (
        <CRTWarp
          color="#191919"
          backgroundColor="#000000"
          mask="none"
          curvature={0.35}
          persistence={0.8}
          lightMode={false}
          speed={0.35}
          variation={0}
          waveAmplitude={0.2}
          waveFrequency={3.2}
          levels={4}
          columns={112}
          corners={0}
          scanlineStrength={1}
          scanlineFrequency={260}
          maskStrength={0.3}
          bloom={0.7}
          bloomRadius={1}
          rgbShift={0}
          noise={0.3}
          flicker={0.1}
          interference={1}
          vignette={1}
          brightness={1}
          intro
          mouseReact
          mouseStrength={0.1}
          changeOnClick={false}
          dpr={1.5}
          paused={false}
        />
      )}
    </div>
  );
}
