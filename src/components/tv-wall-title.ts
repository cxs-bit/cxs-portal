import type * as Three from "three";

// A camera-facing sign stays level behind the cabinet as the room perspective changes.
export function createWallTitle(THREE: typeof Three) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.center.x = 0.5;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  const gapInLetterHeights = 0.5;
  let wordAspect = 4;

  function write(label: string) {
    const word = label.toUpperCase();
    context.font = '900 400px "Figtree Variable", sans-serif';
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    const ink = context.measureText(word);
    const width = ink.actualBoundingBoxLeft + ink.actualBoundingBoxRight;
    const height = ink.actualBoundingBoxAscent + ink.actualBoundingBoxDescent;
    const gap = height * gapInLetterHeights;
    const tileWidth = width + gap;
    wordAspect = width / height;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.scale(canvas.width / tileWidth, canvas.height / height);
    context.fillStyle = "#242925";
    context.fillText(word, gap / 2 + ink.actualBoundingBoxLeft, ink.actualBoundingBoxAscent);
    context.restore();
    texture.needsUpdate = true;
  }

  function align(camera: Three.PerspectiveCamera, depth: number) {
    const viewHeight = 2 * depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const viewWidth = viewHeight * camera.aspect;
    const letterHeight = Math.max(viewWidth * 1.42 / wordAspect, viewHeight * 0.35);
    mesh.scale.set(viewWidth, letterHeight, 1);
    texture.repeat.x = viewWidth / (letterHeight * (wordAspect + gapInLetterHeights));
    mesh.quaternion.copy(camera.quaternion);
    mesh.position.set(0, 0, -depth).applyMatrix4(camera.matrixWorld);
  }

  function advance(seconds: number) {
    // Advance in letter heights so short and long channel names drift at the same pace.
    texture.offset.x = (texture.offset.x + seconds * 0.18 / (wordAspect + gapInLetterHeights)) % 1;
  }

  return { mesh, write, align, advance, dispose() { texture.dispose(); material.dispose(); mesh.geometry.dispose(); } };
}
