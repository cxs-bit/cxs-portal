import * as THREE from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createRecordWall } from "../src/components/tv-record-wall";
import type { WallPoster } from "../src/lib/wall-posters";

afterEach(() => vi.unstubAllGlobals());

function setup() {
  const drawImage = vi.fn();
  vi.stubGlobal("document", {
    createElement: () => {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({
          canvas, drawImage, fillRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(),
          fill: vi.fn(), stroke: vi.fn(), fillText: vi.fn(),
        }),
      };
      return canvas;
    },
  });
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", async (blob: Blob) => ({
    source: await blob.text(), width: 1200, height: 600, close,
  }));
  const fetchArtwork = vi.fn(async (url: string) => new Response(url));
  vi.stubGlobal("fetch", fetchArtwork);
  const records = createRecordWall(THREE);
  const redraw = vi.fn();
  const show = (posters: WallPoster[], signal = new AbortController().signal) =>
    records.setPosters(posters, signal, redraw);
  return { records, show, drawImage, fetchArtwork, redraw, close };
}

function poster(id: string, image?: string, kind: WallPoster["kind"] = "track"): WallPoster {
  return { id, title: id, description: "", image, kind };
}

it("reuses unchanged artwork, removes old slots, and restores cached artwork across channel changes", async () => {
  const { records, show, fetchArtwork, drawImage, redraw } = setup();
  const a = poster("a", "/a");
  const b = poster("b", "/b");

  await show([a, b]);
  redraw.mockClear();
  drawImage.mockClear();
  await show([{ ...a }, { ...b }]);
  expect(fetchArtwork).toHaveBeenCalledTimes(2);
  expect(drawImage).not.toHaveBeenCalled();
  expect(redraw).not.toHaveBeenCalled();

  await show([a, poster("c", "/c")]);
  expect(drawImage.mock.calls.map(([bitmap]) => bitmap.source)).toEqual(["/c"]);
  expect(records.wall.children.map(mesh => mesh.userData.posterId)).toEqual(["a", "c"]);

  await show([]);
  expect(records.wall.children).toHaveLength(0);
  await show([b]);
  expect(fetchArtwork).toHaveBeenCalledTimes(3);
  expect(records.wall.children.map(mesh => mesh.userData.posterId)).toEqual(["b"]);
  records.dispose();
});

it("retries failed artwork and raycasts only mounted posters", async () => {
  const { records, show, fetchArtwork, drawImage, redraw } = setup();
  await show([poster("work", "/portrait", "portrait")]);
  expect(drawImage.mock.calls[0]).toEqual([
    expect.objectContaining({ source: "/portrait" }), 15, 161.5, 378, 189,
  ]);
  fetchArtwork.mockResolvedValueOnce(new Response(null, { status: 404 }));
  redraw.mockClear();
  await show([poster("work", "/unavailable", "portrait")]);
  expect(fetchArtwork).toHaveBeenCalledTimes(2);
  expect(drawImage).toHaveBeenCalledTimes(1);
  expect(redraw).toHaveBeenCalledOnce();
  await show([poster("work", "/unavailable", "portrait")]);
  expect(fetchArtwork).toHaveBeenCalledTimes(3);
  expect(drawImage).toHaveBeenCalledTimes(2);

  const position = records.wall.children[0].position.clone();
  const ray = new THREE.Raycaster(position.add(new THREE.Vector3(0, 0, 5)), new THREE.Vector3(0, 0, -1));
  expect(records.pick(ray)).toEqual({ id: "work", distance: 5 });

  await show([poster("project", undefined, "project")]);
  expect(records.wall.children.map(mesh => mesh.userData.posterId)).toEqual(["project"]);
  await show([]);
  expect(records.pick(ray)).toBeNull();
  records.dispose();
});

it("ignores an artwork request that resolves after its channel is replaced", async () => {
  const { records, show, fetchArtwork, drawImage } = setup();
  let finish!: (value: Response) => void;
  fetchArtwork.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const old = show([poster("old", "/old")]);
  await show([poster("project", "/project", "project")]);
  finish(new Response("/old"));
  await old;

  expect(drawImage.mock.calls.map(([bitmap]) => bitmap.source)).toEqual(["/project"]);
  expect(records.wall.children.map(mesh => mesh.userData.posterId)).toEqual(["project"]);
  records.dispose();
});

it("loads local technology artwork when the bitmap decoder rejects SVG", async () => {
  const { records, show, drawImage, fetchArtwork } = setup();
  const decode = vi.fn(async () => {});
  vi.stubGlobal("createImageBitmap", async () => { throw new Error("SVG not supported"); });
  vi.stubGlobal("Image", class {
    src = "";
    naturalWidth = 24;
    naturalHeight = 24;
    decode = decode;
  });
  fetchArtwork.mockResolvedValueOnce(new Response("<svg/>", { headers: { "Content-Type": "image/svg+xml" } }));

  await show([poster("react", "/logos/react.svg", "technology")]);
  expect(decode).toHaveBeenCalledOnce();
  expect(drawImage).toHaveBeenCalledOnce();
  records.dispose();
});
