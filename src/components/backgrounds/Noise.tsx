"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type NoiseProps = {
  opacity: number;
  size: number;
  fps: number;
  blendMode: CSSProperties["mixBlendMode"];
  contrast: number;
  colored: boolean;
  dust: number;
  scratches: number;
  scanlines: number;
  flicker: number;
};

const tileSize = 224;
const frameCount = 24;

export default function Noise({
  opacity, size, fps, blendMode, contrast, colored, dust, scratches, scanlines, flicker,
}: NoiseProps) {
  const textureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const texture = textureRef.current;
    const tile = document.createElement("canvas");
    tile.width = tile.height = tileSize;
    const context = tile.getContext("2d");
    if (!texture || !context) return;

    const sample = context.createImageData(tileSize, tileSize);
    for (let index = 0; index < sample.data.length; index += 4) {
      const gray = 128 + (Math.random() - 0.5) * 255 * contrast;
      sample.data[index] = gray;
      sample.data[index + 1] = colored ? gray + (Math.random() - 0.5) * 84 : gray;
      sample.data[index + 2] = colored ? gray + (Math.random() - 0.5) * 84 : gray;
      sample.data[index + 3] = 255;
    }
    context.putImageData(sample, 0, 0);
    context.fillStyle = "rgb(255 255 255 / 0.55)";
    for (let index = 0; index < Math.round(dust * 10); index++) {
      context.fillRect(Math.random() * tileSize, Math.random() * tileSize, 2, 1);
    }
    for (let index = 0; index < Math.round(scratches * 8); index++) {
      context.fillRect(Math.random() * tileSize, Math.random() * tileSize, 1, tileSize * 0.12);
    }

    texture.style.backgroundImage = `url(${tile.toDataURL()})`;
    texture.style.backgroundSize = `${tileSize * size}px`;
    // Shift the repeating tile in discrete steps to change the grain without repainting a canvas.
    const frames = Array.from({ length: frameCount }, () => ({
      transform: `translate(${Math.round(Math.random() * 24)}px, ${Math.round(Math.random() * 24)}px)`,
      opacity: 1 - Math.random() * flicker * 0.14,
      easing: "steps(1, end)",
    }));
    const animation = texture.animate([...frames, frames[0]], {
      duration: frameCount * 1000 / fps,
      iterations: Infinity,
    });

    function updateVisibility() {
      if (document.hidden) animation.pause();
      else animation.play();
    }

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      animation.cancel();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [size, fps, contrast, colored, dust, scratches, flicker]);

  return (
    <div
      className="crt-intro-noise"
      style={{ opacity: `calc(${opacity} * var(--room-noise-visibility, 1))`, mixBlendMode: blendMode }}
      aria-hidden="true"
    >
      <div ref={textureRef} className="crt-intro-noise-texture" />
      <div className="crt-intro-noise-lines" style={{ opacity: scanlines * 0.25 }} />
    </div>
  );
}
