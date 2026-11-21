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
          color="#3dff7a"
          backgroundColor="#091c1b"
          mask="none"
          curvature={0.3}
          persistence={0.9}
          lightMode={false}
          speed={0.4}
          variation={0}
          waveAmplitude={0.45}
          waveFrequency={5.1}
          levels={3}
          columns={112}
          corners={0}
          scanlineStrength={0.7}
          scanlineFrequency={220}
          bloom={2.2}
          bloomRadius={1.4}
          rgbShift={0}
          noise={0}
          flicker={0.1}
          interference={0.15}
          vignette={0.4}
          brightness={1}
          intro={false}
          mouseReact
          mouseStrength={0.1}
          changeOnClick={false}
          dpr={2}
          paused={false}
          fps={20}
        />
      )}
    </div>
  );
}
