import type * as Three from "three";
import type { ChannelId } from "@/lib/channel-catalog";

// Coordinates in the painted chart; the rotating index uses the same units.
const size = 1024;
const radius = 376;
const tickRadius = radius + 38;
const channelAngles: Record<ChannelId, number> = { portfolio: 45, work: 0, personal: -45 };

function paintChart() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ink = canvas.getContext("2d")!;
  ink.translate(size / 2, size / 2);

  function line(x1: number, y1: number, x2: number, y2: number) {
    ink.beginPath();
    ink.moveTo(x1, y1);
    ink.lineTo(x2, y2);
    ink.stroke();
  }

  ink.save();
  ink.beginPath();
  ink.arc(0, 0, radius, 0, Math.PI * 2);
  ink.clip();
  ink.fillStyle = "#313638";
  ink.fillRect(-radius, -radius, radius * 2, radius * 2);
  ink.fillStyle = "#393e40";
  ink.fillRect(-radius, -radius, radius, radius);
  ink.fillRect(0, 0, radius, radius);
  ink.fillStyle = "#292d2e";
  ink.fillRect(-154, -radius, 308, 134);
  const shading = ink.createLinearGradient(-radius, -radius, radius, radius);
  shading.addColorStop(0, "rgba(145, 150, 146, .10)");
  shading.addColorStop(1, "rgba(9, 12, 13, .29)");
  ink.fillStyle = shading;
  ink.fillRect(-radius, -radius, radius * 2, radius * 2);
  ink.strokeStyle = "#777b79";
  ink.lineWidth = 2;
  line(-radius, 0, radius, 0);
  line(0, -radius, 0, -radius + 14);

  // Grey steps and two spatial-frequency patches from an analogue test card.
  ["#848784", "#717572", "#616662", "#505552", "#414645", "#323737"].forEach((color, i) => {
    ink.fillStyle = color;
    ink.fillRect(-110 + i * 37, -radius + 22, 37, 22);
  });
  ink.fillStyle = "#91938c";
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) ink.fillRect(side * 304 - 33 + i * 6, 74, 2.4, 72);
  }
  ink.restore();

  ink.strokeStyle = "#9b9c91";
  ink.lineWidth = 3;
  ink.beginPath();
  ink.arc(0, 0, radius, 0, Math.PI * 2);
  ink.stroke();
  for (let i = 0; i < 72; i++) {
    ink.save();
    ink.rotate(i * Math.PI / 36);
    const major = i % 6 === 0;
    ink.lineWidth = major ? 3.5 : 2.5;
    line(0, -tickRadius + 12, 0, -tickRadius - (major ? 15 : 3));
    ink.restore();
  }
  ink.lineWidth = 2;
  for (const x of [-464, 464]) {
    line(x - 18, 0, x + 18, 0);
    line(x, -18, x, 18);
  }
  return canvas;
}

export function createCalibrationMural(THREE: typeof Three, initial: ChannelId) {
  const paint = new THREE.CanvasTexture(paintChart());
  paint.colorSpace = THREE.SRGBColorSpace;
  const plane = new THREE.PlaneGeometry(1, 1);
  const paintMaterial = new THREE.MeshBasicMaterial({ map: paint, transparent: true, depthWrite: false, toneMapped: false });
  const markMaterial = new THREE.MeshBasicMaterial({ color: "#60b1ea", toneMapped: false });
  const wall = new THREE.Group();
  const dial = new THREE.Group();
  const mark = new THREE.Mesh(plane, markMaterial);
  mark.scale.set(9 / size, 29 / size, 1);
  mark.position.set(0, tickRadius / size, 0.001);
  dial.add(mark);
  wall.add(new THREE.Mesh(plane, paintMaterial), dial);

  let from = THREE.MathUtils.degToRad(channelAngles[initial]);
  let to = from;
  let started = 0;
  dial.rotation.z = to;

  function update(now: number) {
    const fraction = THREE.MathUtils.clamp((now - started) / 220, 0, 1);
    dial.rotation.z = THREE.MathUtils.lerp(from, to, THREE.MathUtils.smoothstep(fraction, 0, 1));
    return from !== to && fraction < 1;
  }

  function tune(channel: ChannelId) {
    const angle = THREE.MathUtils.degToRad(channelAngles[channel]);
    if (angle === to) return;
    const now = performance.now();
    update(now);
    from = dial.rotation.z;
    to = angle;
    started = now;
  }

  function dispose() {
    plane.dispose();
    paint.dispose();
    paintMaterial.dispose();
    markMaterial.dispose();
  }

  return { wall, mark, tune, update, dispose };
}
