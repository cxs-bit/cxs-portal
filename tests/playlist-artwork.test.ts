import { afterEach, describe, expect, it, vi } from "vitest";
import { getPlaylistArtwork } from "../src/lib/playlist-artwork";

vi.mock("server-only", () => ({}));

const playlist = "https://music.youtube.com/playlist?list=PLExample";
const apiKey = "test-key";
const high = "https://i.ytimg.com/vi/example/hqdefault.jpg";
const medium = "https://i.ytimg.com/vi/other/mqdefault.jpg";

afterEach(() => vi.unstubAllGlobals());

describe("playlist artwork", () => {
  it("reads a single page and selects distinct thumbnails from verified hosts in playlist order", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      items: [
        { snippet: { thumbnails: { high: { url: high }, default: { url: medium } } } },
        { snippet: { thumbnails: { high: { url: high } } } },
        { snippet: { thumbnails: { high: { url: "https://i.ytimg.com.example.org/art.jpg" }, medium: { url: medium } } } },
        { snippet: { thumbnails: { high: { url: "http://i.ytimg.com/art.jpg" } } } },
        { snippet: { thumbnails: { high: { url: "https://i.ytimg.com:3000/art.jpg" } } } },
        {},
      ],
      nextPageToken: "unused",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPlaylistArtwork(playlist, apiKey)).resolves.toEqual([high, medium]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      new URL("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PLExample&maxResults=50&fields=items%28snippet%28thumbnails%29%29"),
      {
        headers: { "X-Goog-Api-Key": apiKey },
        redirect: "error",
        signal: expect.any(AbortSignal),
        cache: "no-store",
      },
    );
  });

  it("caps the number of returned thumbnails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      items: Array.from({ length: 50 }, (_, index) => ({
        snippet: { thumbnails: { high: { url: `https://i.ytimg.com/vi/${index}/hqdefault.jpg` } } },
      })),
    })));

    await expect(getPlaylistArtwork(playlist, apiKey)).resolves.toHaveLength(16);
  });

  it("accepts additional thumbnail sizes and skips malformed items or sizes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      items: [
        null,
        { snippet: { thumbnails: "unavailable" } },
        { snippet: { thumbnails: { high: { url: 42 }, fhd: { url: high } } } },
        { snippet: { thumbnails: { qhd: { url: medium } } } },
      ],
    })));

    await expect(getPlaylistArtwork(playlist, apiKey)).resolves.toEqual([high, medium]);
  });

  it("uses the canonical playlist URL to retrieve one public thumbnail without an API key", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ thumbnail_url: high }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPlaylistArtwork(playlist, undefined)).resolves.toEqual([high]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      new URL("https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fplaylist%3Flist%3DPLExample&format=json"),
      {
        headers: undefined,
        redirect: "error",
        signal: expect.any(AbortSignal),
        cache: "no-store",
      },
    );
  });

  it("skips the network for a missing or invalid playlist", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPlaylistArtwork(undefined, undefined)).resolves.toBeNull();
    await expect(getPlaylistArtwork(undefined, apiKey)).resolves.toBeNull();
    await expect(getPlaylistArtwork("https://example.com/playlist?list=PLExample", apiKey)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("handles rejected requests, YouTube errors and malformed responses", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce(new Response(null, { status: 403 }))
      .mockResolvedValueOnce(Response.json({ items: false })));

    await expect(getPlaylistArtwork(playlist, apiKey)).resolves.toBeNull();
    await expect(getPlaylistArtwork(playlist, apiKey)).resolves.toBeNull();
    await expect(getPlaylistArtwork(playlist, apiKey)).resolves.toBeNull();
  });

  it("handles a failed oEmbed request or an unverified thumbnail URL", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(Response.json({ thumbnail_url: "https://example.com/art.jpg" })));

    await expect(getPlaylistArtwork(playlist, undefined)).resolves.toBeNull();
    await expect(getPlaylistArtwork(playlist, undefined)).resolves.toBeNull();
  });
});
