import type * as Three from "three";

// A camera-facing sign stays level behind the cabinet as the room perspective changes.
export function createWallTitle(THREE: typeof Three) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  let aspect = 4;

  function write(label: string) {
    const word = label.toUpperCase();
    context.font = '900 400px "Figtree Variable", sans-serif';
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    const ink = context.measureText(word);
    const width = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
    const height = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
    aspect = width / height;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.scale(canvas.width / width, canvas.height / height);
    context.fillStyle = "#242925";
    context.fillText(word, ink.actualBoundingBoxLeft, ink.actualBoundingBoxAscent);
    context.restore();
    texture.needsUpdate = true;
  }

  function align(camera: Three.PerspectiveCamera, depth: number) {
    const viewHeight = 2 * depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const width = Math.max(viewHeight * camera.aspect * 1.42, viewHeight * 0.35 * aspect);
    mesh.scale.set(width, width / aspect, 1);
    mesh.quaternion.copy(camera.quaternion);
    mesh.position.set(0, 0, -depth).applyMatrix4(camera.matrixWorld);
  }

  return { mesh, write, align, dispose() { texture.dispose(); material.dispose(); mesh.geometry.dispose(); } };
}
