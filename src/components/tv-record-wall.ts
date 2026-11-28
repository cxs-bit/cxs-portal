import type * as Three from "three";
import type { WallPoster } from "@/lib/wall-posters";

// Positions are in sleeve widths, measured up from the floor.
const sleeves = [
  [-0.70, 2.63, -2], [0.42, 2.61, 1],
  [-1.71, 2.58, 3], [1.44, 2.66, -2],
  [-2.74, 2.55, 1], [2.52, 2.58, -3],
  [-1.30, 1.62, -2], [1.54, 1.59, 2],
  [-2.35, 1.54, 1], [2.58, 1.56, -1],
  [-3.36, 1.58, -3], [3.60, 1.59, 2],
  [-1.88, 0.54, 2], [1.44, 0.54, -2],
  [-2.92, 0.57, -1], [2.48, 0.53, 1],
] as const;

const portfolioPositions = [
  [-0.93, 2.69, -2], [0.86, 2.63, 1],
  [-2.42, 2.54, 2], [2.32, 2.59, -1],
  [-1.63, 1.55, -1], [1.68, 1.51, 2],
  [-2.74, 1.55, 1], [2.81, 1.51, -1],
  ...sleeves.slice(10, 12),
  [-3.62, 2.63, 2], [3.48, 2.61, 1],
  ...sleeves.slice(12),
] as const;

const paperColors = [
  ["#d8ad67", "#453c38", "#fbebce"],
  ["#99786d", "#47323a", "#f5dfd2"],
  ["#6c8881", "#253a39", "#e7eee1"],
  ["#8692a6", "#303447", "#ebecf4"],
] as const;

type Artwork = { source: CanvasImageSource; width: number; height: number; release: () => void };
type PosterMesh = {
  mesh: Three.Mesh<Three.PlaneGeometry, Three.MeshBasicMaterial>;
  ink: CanvasRenderingContext2D;
  texture: Three.CanvasTexture;
  poster: WallPoster;
  displayedImage?: string;
  request?: { controller: AbortController; signal: AbortSignal; url: string; done: Promise<void> };
};

async function loadArtwork(url: string, signal: AbortSignal): Promise<Artwork> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Poster artwork unavailable");
  const blob = await response.blob();
  signal.throwIfAborted();
  try {
    const bitmap = await createImageBitmap(blob);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {
    // SVG decoding through createImageBitmap varies across browsers.
    signal.throwIfAborted();
    const objectURL = URL.createObjectURL(blob);
    const image = new Image();
    const abort = () => { image.src = ""; };
    signal.addEventListener("abort", abort, { once: true });
    try {
      image.src = objectURL;
      await image.decode();
      return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => {} };
    } finally {
      signal.removeEventListener("abort", abort);
      URL.revokeObjectURL(objectURL);
    }
  }
}

function isSleeve(poster: WallPoster) {
  return poster.kind === "track" || poster.kind === "playlist";
}

function frame(ink: CanvasRenderingContext2D, paper: string) {
  const { width, height } = ink.canvas;
  ink.fillStyle = "#2c2625";
  ink.fillRect(0, 0, width, height);
  ink.fillStyle = "#766256";
  ink.fillRect(4, 4, width - 8, height - 8);
  ink.fillStyle = paper;
  ink.fillRect(11, 11, width - 22, height - 22);
}

function drawFallback(ink: CanvasRenderingContext2D, poster: WallPoster) {
  const { width, height } = ink.canvas;
  const hash = Array.from(poster.id).reduce((value, letter) => (value * 31 + letter.codePointAt(0)!) >>> 0, 0);
  const [color, shade, paper] = paperColors[hash % paperColors.length];
  frame(ink, color);
  if (isSleeve(poster)) {
    ink.fillStyle = shade;
    ink.beginPath();
    ink.arc(width * 0.50, height * 0.44, width * 0.34, 0, Math.PI * 2);
    ink.fill();
    ink.strokeStyle = color;
    ink.lineWidth = 2;
    for (const radius of [0.11, 0.17, 0.23, 0.29, 0.32]) {
      ink.beginPath();
      ink.arc(width * 0.50, height * 0.44, width * radius, 0, Math.PI * 2);
      ink.stroke();
    }
    ink.fillStyle = paper;
    ink.beginPath();
    ink.arc(width * 0.50, height * 0.44, width * 0.085, 0, Math.PI * 2);
    ink.fill();
  } else {
    const initials = poster.title.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join("");
    ink.fillStyle = shade;
    ink.fillRect(width * 0.12, height * 0.13, width * 0.76, height * 0.56);
    ink.fillStyle = paper;
    ink.font = `bold ${Math.round(height * 0.29)}px Georgia, serif`;
    ink.textAlign = "center";
    ink.textBaseline = "middle";
    ink.fillText(initials.toUpperCase(), width / 2, height * 0.42, width * 0.65);
  }
  ink.fillStyle = shade;
  ink.font = `bold ${Math.round(height * 0.074)}px Georgia, serif`;
  ink.textAlign = "center";
  ink.textBaseline = "middle";
  ink.fillText(poster.title, width / 2, height * 0.866, width * 0.80);
}

function drawArtwork(ink: CanvasRenderingContext2D, poster: WallPoster, image: Artwork) {
  const { width, height } = ink.canvas;
  if (isSleeve(poster)) {
    const side = Math.min(image.width, image.height);
    ink.drawImage(image.source, (image.width - side) / 2, (image.height - side) / 2,
      side, side, 0, 0, width, height);
    return;
  }
  frame(ink, poster.kind === "technology" ? "#e5daca" : "#1c1a1e");
  const margin = poster.kind === "technology" ? width * 0.17 : 15;
  const scale = Math.min((width - margin * 2) / image.width, (height - margin * 2) / image.height);
  const drawnWidth = image.width * scale;
  const drawnHeight = image.height * scale;
  ink.drawImage(image.source, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
}

export function createRecordWall(THREE: typeof Three) {
  const wall = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(1, 1);
  const cache = new Map<string, PosterMesh>();
  let disposed = false;
  let revision = 0;
  let artworkChanged = false;

  function createPoster(poster: WallPoster): PosterMesh {
    const canvas = document.createElement("canvas");
    canvas.width = poster.kind === "project" ? 640 : poster.kind === "portrait" ? 408 : 256;
    canvas.height = poster.kind === "project" ? 384 : poster.kind === "portrait" ? 512 : 256;
    const ink = canvas.getContext("2d")!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xd4cdc5, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material);
    drawFallback(ink, poster);
    return { mesh, ink, texture, poster };
  }

  function loadPoster(entry: PosterMesh, url: string, signal: AbortSignal) {
    if (entry.request?.url === url && !entry.request.signal.aborted) return entry.request.done;
    if (entry.displayedImage === url) return;
    entry.request?.controller.abort();
    const controller = new AbortController();
    const active = AbortSignal.any([signal, controller.signal]);
    const deadline = AbortSignal.any([active, AbortSignal.timeout(6500)]);
    const done = loadArtwork(url, deadline).then(image => {
      try {
        deadline.throwIfAborted();
        drawArtwork(entry.ink, entry.poster, image);
        entry.texture.needsUpdate = true;
        entry.displayedImage = url;
        artworkChanged = true;
      } finally {
        image.release();
      }
    }).catch(() => {
      if (!active.aborted && entry.displayedImage) {
        drawFallback(entry.ink, entry.poster);
        entry.texture.needsUpdate = true;
        entry.displayedImage = undefined;
        artworkChanged = true;
      }
    }).finally(() => {
      if (entry.request?.controller === controller) {
        entry.request = undefined;
      }
    });
    entry.request = { controller, signal: active, url, done };
    return done;
  }

  function release(entry: PosterMesh) {
    entry.request?.controller.abort();
    entry.mesh.material.dispose();
    entry.texture.dispose();
  }

  async function setPosters(posters: readonly WallPoster[], signal: AbortSignal, redraw: () => void) {
    if (disposed || signal.aborted) return;
    const current = ++revision;
    const visible = posters.slice(0, sleeves.length);
    const records = visible.every(isSleeve);
    const previous = [...wall.children];
    const mounted = new Set<Three.Object3D>();
    let changed = false;
    const loads = visible.map((poster, index) => {
      const key = `${poster.kind}:${poster.id}`;
      const entry = cache.get(key) ?? createPoster(poster);
      cache.delete(key);
      cache.set(key, entry);

      if (entry.poster.image !== poster.image) {
        entry.request?.controller.abort();
      }
      if ((!poster.image && entry.displayedImage) || (!entry.displayedImage && entry.poster.title !== poster.title)) {
        drawFallback(entry.ink, poster);
        entry.texture.needsUpdate = true;
        entry.displayedImage = undefined;
        changed = true;
      }
      entry.poster = poster;

      const { mesh, ink } = entry;
      const [x, y, angle] = poster.kind === "portrait" && visible.length === 1
        ? [-1.12, 2.63, -3]
        : (records ? sleeves : portfolioPositions)[index];
      const width = poster.kind === "project" ? 1.58 : poster.kind === "portrait" ? 1.24 : 1;
      const rotation = THREE.MathUtils.degToRad(angle);
      if (mesh.parent !== wall) {
        wall.add(mesh);
        changed = true;
      }
      const z = index * 0.002;
      if (mesh.position.x !== x || mesh.position.y !== y || mesh.position.z !== z || mesh.rotation.z !== rotation) {
        mesh.position.set(x, y, z);
        mesh.rotation.z = rotation;
        changed = true;
      }
      mesh.scale.set(width, width * ink.canvas.height / ink.canvas.width, 1);
      mesh.userData.posterId = poster.id;
      mounted.add(mesh);

      if (poster.image) return loadPoster(entry, poster.image, signal);
    });

    for (const mesh of previous) {
      if (!mounted.has(mesh)) {
        wall.remove(mesh);
        changed = true;
      }
    }
    for (const [key, entry] of cache) {
      if (mounted.has(entry.mesh)) continue;
      entry.request?.controller.abort();
      if (cache.size > sleeves.length * 2) {
        release(entry);
        cache.delete(key);
      }
    }
    if (changed || artworkChanged) {
      artworkChanged = false;
      redraw();
    }
    await Promise.all(loads);
    if (current === revision && !disposed && !signal.aborted && artworkChanged) {
      artworkChanged = false;
      redraw();
    }
  }

  function pick(ray: Three.Raycaster) {
    wall.updateWorldMatrix(true, true);
    const hit = ray.intersectObjects(wall.children, false)[0];
    return hit ? { id: hit.object.userData.posterId as string, distance: hit.distance } : null;
  }

  function dispose() {
    disposed = true;
    wall.clear();
    cache.forEach(release);
    cache.clear();
    geometry.dispose();
  }
  return { wall, setPosters, pick, dispose };
}
