import type * as Three from "three";

// Hand-hung positions in sleeve widths, measured up from the floor. The first
// slots frame the set so even a short playlist is visible on a narrow screen.
const sleeves = [
  // x, y, angle in degrees, fallback tile
  [-0.70, 2.63, -2, 6], [0.42, 2.61, 1, 2],
  [-1.71, 2.58, 3, 0], [1.44, 2.66, -2, 9],
  [-2.74, 2.55, 1, 1], [2.52, 2.58, -3, 10],
  [-1.30, 1.62, -2, 13], [1.54, 1.59, 2, 3],
  [-2.35, 1.54, 1, 8], [2.58, 1.56, -1, 4],
  [-3.36, 1.58, -3, 12], [3.60, 1.59, 2, 15],
  [-1.88, 0.54, 2, 11], [1.44, 0.54, -2, 14],
  [-2.92, 0.57, -1, 5], [2.48, 0.53, 1, 7],
] as const;

async function loadImage(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Sleeve artwork unavailable");
  return createImageBitmap(await response.blob());
}

export function createRecordWall(THREE: typeof Three) {
  const wall = new THREE.Group();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ink = canvas.getContext("2d")!;
  const cell = canvas.width / 4;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xbab7b3, toneMapped: false });
  const geometries = sleeves.map(([x, y, angle, tile], index) => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const uv = geometry.getAttribute("uv");
    // Sample inside the cell so a neighboring jacket never bleeds into its edge.
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (tile % 4 + 0.005 + uv.getX(i) * 0.99) / 4,
        (3 - Math.floor(tile / 4) + 0.005 + uv.getY(i) * 0.99) / 4);
    }
    const sleeve = new THREE.Mesh(geometry, material);
    sleeve.position.set(x, y, index * 0.002);
    sleeve.rotation.z = THREE.MathUtils.degToRad(angle);
    wall.add(sleeve);
    return geometry;
  });
  wall.visible = false;

  async function load(signal: AbortSignal, redraw: () => void) {
    const fallback = await loadImage("/images/tv/record-sleeves.webp", signal).catch(() => null);
    if (fallback && !signal.aborted) {
      ink.drawImage(fallback, 0, 0, canvas.width, canvas.height);
      texture.needsUpdate = true;
      wall.visible = true;
      redraw();
    }
    fallback?.close();
    if (signal.aborted) return;
    const result = await fetch("/api/tv/artwork", { signal });
    if (!result.ok) return;
    const { covers }: { covers: string[] } = await result.json();
    if (!covers.length) return;

    // Batch the texture upload; individual failed images keep their local art.
    const deadline = AbortSignal.any([signal, AbortSignal.timeout(6500)]);
    const loaded = await Promise.allSettled(covers.slice(0, sleeves.length).map(async (url, i) => {
      const cover = await loadImage(url, deadline);
      if (!signal.aborted) {
        const tile = sleeves[i][3];
        const size = Math.min(cover.width, cover.height);
        ink.drawImage(cover, (cover.width - size) / 2, (cover.height - size) / 2, size, size,
          (tile % 4) * cell, Math.floor(tile / 4) * cell, cell, cell);
      }
      cover.close();
    }));
    if (!signal.aborted && loaded.some(item => item.status === "fulfilled")) {
      wall.visible = true;
      texture.needsUpdate = true;
      redraw();
    }
  }

  function dispose() {
    geometries.forEach(geometry => geometry.dispose());
    material.dispose();
    texture.dispose();
  }
  return { wall, load, dispose };
}
