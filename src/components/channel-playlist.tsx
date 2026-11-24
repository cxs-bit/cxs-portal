"use client";

import { PlayCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { buttonVariants } from "./ui/button";

export function ChannelPlaylist({ playlistId, href }: { playlistId: string; href: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <div className="channel-player">
        {playing ? (
          <iframe
            title="Carlos’s favorite songs on YouTube"
            src={`https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&autoplay=1`}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            ref={frame => { frame?.focus({ preventScroll: true }); }}
          />
        ) : (
          <a
            className={buttonVariants({ size: "lg" })}
            href={href}
            onClick={event => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              setPlaying(true);
            }}
          >
            <HugeiconsIcon aria-hidden="true" icon={PlayCircleIcon} />
            Play playlist
          </a>
        )}
      </div>
      <a className="text-link channel-player-link" href={href}>Open in YouTube Music</a>
    </>
  );
}
