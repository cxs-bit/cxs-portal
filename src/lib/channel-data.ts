import { z } from "zod";

const copy = z.string().trim().min(1);
const link = copy.refine(value => /^https:\/\//i.test(value) || /^\/(?![\/\\])/.test(value), "Use a site path or HTTPS URL");
const asset = z.object({ href: link, label: copy });

export function youtubePlaylistId(value: string) {
  try {
    const url = new URL(value);
    const id = url.searchParams.get("list") ?? "";
    if (url.protocol === "https:" && ["music.youtube.com", "www.youtube.com", "youtube.com"].includes(url.hostname)
      && url.pathname === "/playlist" && /^[a-zA-Z0-9_-]+$/.test(id)) return id;
  } catch { /* A malformed URL has no playable playlist. */ }
  return null;
}

export const workSchema = z.object({
  introduction: copy.optional(),
  cv: asset.optional(),
  approach: z.array(copy).default([]),
  education: z.array(z.object({ qualification: copy, school: copy, period: copy.optional() })).default([]),
});
export const personalSchema = z.object({
  portrait: z.object({ href: link, alt: copy, caption: copy }).optional(),
  playlist: copy.refine(value => Boolean(youtubePlaylistId(value)), "Use a shared YouTube Music playlist URL").optional(),
  fact: copy.optional(),
});
export type Work = z.infer<typeof workSchema>;
export type Personal = z.infer<typeof personalSchema>;
