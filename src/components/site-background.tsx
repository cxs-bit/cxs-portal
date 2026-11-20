"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const CRTWarp = dynamic(() => import("./backgrounds/CRTWarp"), { ssr: false });
const motionQuery = "(prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function SiteBackground() {
  const motionAllowed = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  );

  return (
    <div className="site-crt" aria-hidden="true">
      {motionAllowed && (
        <CRTWarp
          color="#7c3aed"
          backgroundColor="#28143a"
          mask="none"
          curvature={0.4}
          persistence={0.24}
          lightMode={false}
          speed={0.4}
          variation={0}
          waveAmplitude={0.29}
          waveFrequency={5.1}
          levels={3}
          columns={112}
          corners={0}
          scanlineStrength={0}
          scanlineFrequency={160}
          bloom={1.4}
          bloomRadius={1}
          rgbShift={0.009}
          noise={0.24}
          flicker={0.6}
          interference={0}
          vignette={0.5}
          brightness={1}
          intro={false}
          mouseReact
          mouseStrength={0.5}
          changeOnClick
          dpr={2}
          paused={false}
          fps={20}
        />
      )}
    </div>
  );
}
