import "server-only";

import { z } from "zod";
import { youtubePlaylistId } from "./channel-data";

const maxCovers = 16;
const thumbnailHosts = new Set(["i.ytimg.com", "i9.ytimg.com", "img.youtube.com"]);
const thumbnailSizes = ["medium", "high", "standard", "maxres", "default"] as const;
const thumbnail = z.object({ url: z.string() });
const playlistItem = z.object({
  snippet: z.object({ thumbnails: z.record(z.string(), z.unknown()) }),
});
const playlistItems = z.object({
  items: z.array(z.unknown()),
});
const playlistEmbed = z.object({ thumbnail_url: z.string() });

function verifiedThumbnail(value: string) {
  const url = URL.parse(value);
  if (url?.protocol === "https:" && thumbnailHosts.has(url.hostname)
    && !url.port && !url.username && !url.password) return url.href;
  return null;
}

export async function getPlaylistArtwork(playlist: string | undefined, apiKey: string | undefined) {
  const playlistId = playlist && youtubePlaylistId(playlist);
  if (!playlistId) return null;

  const url = apiKey
    ? new URL("https://www.googleapis.com/youtube/v3/playlistItems")
    : new URL("https://www.youtube.com/oembed");
  url.search = new URLSearchParams(apiKey
    ? { part: "snippet", playlistId, maxResults: "50", fields: "items(snippet(thumbnails))" }
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
      const cover = parsed.success && verifiedThumbnail(parsed.data.thumbnail_url);
      return cover ? [cover] : null;
    }
    const parsed = playlistItems.safeParse(body);
    if (!parsed.success) return null;

    const covers = new Set<string>();
    for (const item of parsed.data.items) {
      const parsedItem = playlistItem.safeParse(item);
      if (!parsedItem.success) continue;
      const { thumbnails } = parsedItem.data.snippet;
      const sizes = new Set([...thumbnailSizes, ...Object.keys(thumbnails)]);
      for (const size of sizes) {
        const candidate = thumbnail.safeParse(thumbnails[size]);
        if (!candidate.success) continue;
        const cover = verifiedThumbnail(candidate.data.url);
        if (!cover) continue;
        covers.add(cover);
        break;
      }
      if (covers.size === maxCovers) break;
    }
    return [...covers];
  } catch {
    return null;
  }
}
