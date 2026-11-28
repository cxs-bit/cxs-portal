import "server-only";

import { z } from "zod";
import { youtubePlaylistId } from "./channel-data";
import type { WallPoster } from "./wall-posters";

const maxCovers = 16;
const thumbnailHosts = new Set(["i.ytimg.com", "i9.ytimg.com", "img.youtube.com"]);
const thumbnailSizes = ["medium", "high", "standard", "maxres", "default"] as const;
const thumbnail = z.object({ url: z.string() });
const metadataText = z.string().trim().catch("");
const playlistItem = z.object({
  snippet: z.object({
    thumbnails: z.record(z.string(), z.unknown()),
    title: metadataText,
    videoOwnerChannelTitle: metadataText,
  }),
});
const playlistItems = z.object({
  items: z.array(z.unknown()),
});
const playlistEmbed = z.object({
  thumbnail_url: z.string(),
  title: metadataText,
  author_name: metadataText,
});

type PlaylistArtwork = {
  covers: string[];
  posters: WallPoster[];
};

function verifiedThumbnail(value: string) {
  const url = URL.parse(value);
  if (url?.protocol === "https:" && thumbnailHosts.has(url.hostname)
    && !url.port && !url.username && !url.password) return url.href;
  return null;
}

export async function getPlaylistArtwork(
  playlist: string | undefined,
  apiKey: string | undefined,
): Promise<PlaylistArtwork | null> {
  const playlistId = playlist && youtubePlaylistId(playlist);
  if (!playlistId) return null;

  const url = apiKey
    ? new URL("https://www.googleapis.com/youtube/v3/playlistItems")
    : new URL("https://www.youtube.com/oembed");
  url.search = new URLSearchParams(apiKey
    ? { part: "snippet", playlistId, maxResults: "50", fields: "items(snippet(thumbnails,title,videoOwnerChannelTitle))" }
    : { url: `https://www.youtube.com/playlist?list=${playlistId}`, format: "json" }).toString();

  try {
    const response = await fetch(url, {
      headers: apiKey ? { "X-Goog-Api-Key": apiKey } : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(3500),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!apiKey) {
      const parsed = playlistEmbed.safeParse(body);
      if (!parsed.success) return null;
      const cover = verifiedThumbnail(parsed.data.thumbnail_url);
      if (!cover) return null;
      return {
        covers: [cover],
        posters: [{
          id: `playlist:${playlistId}`,
          title: parsed.data.title || "YouTube playlist",
          description: parsed.data.author_name,
          image: cover,
          kind: "playlist",
        }],
      };
    }
    const parsed = playlistItems.safeParse(body);
    if (!parsed.success) return null;

    const postersByCover = new Map<string, WallPoster>();
    for (const item of parsed.data.items) {
      const parsedItem = playlistItem.safeParse(item);
      if (!parsedItem.success) continue;
      const { thumbnails, title, videoOwnerChannelTitle } = parsedItem.data.snippet;
      const sizes = new Set([...thumbnailSizes, ...Object.keys(thumbnails)]);
      for (const size of sizes) {
        const candidate = thumbnail.safeParse(thumbnails[size]);
        if (!candidate.success) continue;
        const cover = verifiedThumbnail(candidate.data.url);
        if (!cover) continue;
        if (!postersByCover.has(cover)) {
          postersByCover.set(cover, {
            id: `track:${cover}`,
            title: title || "YouTube track",
            description: videoOwnerChannelTitle,
            image: cover,
            kind: "track",
          });
        }
        break;
      }
      if (postersByCover.size === maxCovers) break;
    }
    return { covers: [...postersByCover.keys()], posters: [...postersByCover.values()] };
  } catch {
    return null;
  }
}
