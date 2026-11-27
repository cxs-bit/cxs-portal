import * as THREE from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createRecordWall } from "../src/components/tv-record-wall";

afterEach(() => vi.unstubAllGlobals());

it("updates changed sleeves, restores removed slots and preserves the wall on a failed check", async () => {
  const drawImage = vi.fn();
  vi.stubGlobal("document", { createElement: () => ({ getContext: () => ({ drawImage }) }) });
  vi.stubGlobal("createImageBitmap", async (blob: Blob) => ({
    source: await blob.text(), width: 1024, height: 1024, close() {},
  }));
  let playlist = Response.json({ covers: ["a", "b"] });
  const fetchMock = vi.fn(async (url: string) => url === "/api/tv/artwork"
    ? playlist.clone() : new Response(url));
  vi.stubGlobal("fetch", fetchMock);
  const wall = createRecordWall(THREE);
  const redraw = vi.fn();
  const refresh = () => wall.load(new AbortController().signal, redraw);

  await refresh();
  playlist = Response.json({ covers: ["a", "c", "d"] });
  drawImage.mockClear();
  await refresh();
  expect(drawImage.mock.calls.map(([bitmap]) => bitmap.source).sort()).toEqual(["c", "d"]);
  expect(fetchMock.mock.calls.filter(([url]) => url === "a")).toHaveLength(1);

  drawImage.mockClear();
  playlist = new Response(null, { status: 503 });
  await refresh();
  expect(drawImage).not.toHaveBeenCalled();

  playlist = Response.json({ covers: [] });
  await refresh();
  expect(drawImage.mock.calls.map(([bitmap]) => bitmap.source)).toEqual(Array(3).fill("/images/tv/record-sleeves.webp"));
  wall.dispose();
});
