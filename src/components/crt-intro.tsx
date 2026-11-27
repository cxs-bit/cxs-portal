"use client";

import { type ReactNode, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type Lenis from "lenis";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { channels, type ChannelId } from "@/lib/channel-catalog";
import { rememberChannelVisit, tvSessionKey } from "@/lib/tv-session";
import { ChannelArrival } from "./channel-arrival";
import { VisitClock } from "./visit-clock";
import { createRecordWall } from "./tv-record-wall";

const motionQuery = "(prefers-reduced-motion: no-preference)";

type Tuning = { id: ChannelId; roll?: { from: string; direction: "next" | "previous" } };

function subscribe(update: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

export function CrtIntro({ panels }: { panels: Record<ChannelId, ReactNode> }) {
  const pathname = usePathname();
  const router = useRouter();
  const available = channels.filter(item => panels[item.id]);
  const direct = available.find(item => item.href === pathname);
  const [enteredFromShop, setEnteredFromShop] = useState(false);
  const shopSession = pathname === "/" || (enteredFromShop && Boolean(direct));
  const [tuned, setTuned] = useState<Tuning>({ id: "portfolio" });
  const selected = available.find(item => item.id === tuned.id) ?? available[0];
  const position = available.indexOf(selected) + 1;
  const displayed = shopSession ? selected : direct;

  const motionAllowed = useSyncExternalStore(subscribe, () => window.matchMedia(motionQuery).matches, () => false);
  const [unavailable, setUnavailable] = useState(false);
  const [skipScene] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.cxsTvStartup?.skipped) return true;
    const tune = new URLSearchParams(location.search).get("tune");
    if (available.some(channel => channel.id === tune) && !location.hash) return false;
    if (location.hash) return true;
    try { return sessionStorage.getItem(tvSessionKey) === "1"; } catch { return false; }
  });
  const enabled = shopSession && motionAllowed && !skipScene && !unavailable;
  const [inIntro, setInIntro] = useState(false);
  const smoothScrolling = enabled && (pathname === "/" || inIntro);
  const [poweredOn, setPoweredOn] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLAnchorElement>(null);
  const powerRef = useRef<HTMLButtonElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const syncIntroRef = useRef<((force?: boolean) => void) | null>(null);
  const settleRef = useRef<((duration: number) => void) | null>(null);

  const initialTune = useEffectEvent(() => {
    const id = new URLSearchParams(location.search).get("tune");
    const item = available.find(channel => channel.id === id);
    if (item) setTuned({ id: item.id });
  });
  const commitEntry = useEffectEvent(() => {
    if (location.pathname !== "/") return;
    // Save the return tuning on the shop entry, then add exactly one destination.
    setEnteredFromShop(true);
    history.replaceState(null, "", "/?tune=" + selected.id);
    router.push(selected.href, { scroll: false });
  });
  const reopen = useEffectEvent(() => {
    if (location.pathname !== "/") history.back();
  });
  const restoreRoute = useEffectEvent(() => {
    const item = available.find(channel => channel.href === location.pathname);
    if (item) setTuned({ id: item.id });
    else initialTune();
  });
  function tune(direction: number) {
    if (!poweredOn || available.length < 2) return;
    setTuned(current => {
      const index = Math.max(0, available.findIndex(item => item.id === current.id));
      const id = available[(index + direction + available.length) % available.length].id;
      // A second press during a roll lands on the latest choice immediately.
      if (current.roll) return { id };
      return { id, roll: { from: available[index].name, direction: direction > 0 ? "next" : "previous" } };
    });
  }

  useEffect(() => {
    if (!smoothScrolling) return;
    let cancelled = false;

    void import("lenis").then(({ default: SmoothScroll }) => {
      if (cancelled) return;
      const lenis = new SmoothScroll({
        autoRaf: true,
        anchors: true,
        smoothWheel: window.matchMedia("(pointer: fine)").matches,
        lerp: 0.085,
        prevent: (node) => Boolean(node.closest(".search-overlay, .site-card-nav, select, textarea")),
      });
      lenis.on("scroll", () => syncIntroRef.current?.());
      lenisRef.current = lenis;
    }).catch(() => {});

    return () => {
      cancelled = true;
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [smoothScrolling]);

  useEffect(() => {
    const page = document.getElementById("portfolio-page")!;
    if (!enabled) {
      if (skipScene || unavailable) window.cxsTvStartup?.close();
      page.dataset.crtIntro = skipScene && !unavailable ? "ready" : "static";
      return () => { delete page.dataset.crtIntro; };
    }
    if (!stageRef.current || !logoRef.current) return;
    const stage = stageRef.current;
    const logo = logoRef.current;
    const sceneElement = stage.parentElement!;
    const startup = window.cxsTvStartup;
    const skip = () => {
      const directChannel = channels.find(channel => channel.href === location.pathname);
      setTuned({ id: directChannel?.id ?? "portfolio" });
      setUnavailable(true);
    };
    if (startup?.skipped) { skip(); return; }
    window.addEventListener("tv-startup-skip", skip);
    startup?.start();
    page.dataset.crtIntro = "loading";
    const request = new AbortController();
    let cancelled = false;
    let dispose = () => {};
    // A mobile browser may reclaim the GPU while the page is in the background.
    const onContextLoss = () => {
      if (cancelled) return;
      if (startup) startup.fallback();
      else skip();
    };
    stage.addEventListener("webglcontextlost", onContextLoss, true);

    async function setup() {
      const modelUrl = new URL("/models/crt-tv.glb", window.location.href);
      const model = fetch(modelUrl, { signal: request.signal }).then(response => {
        if (!response.ok) throw new Error("CRT model unavailable");
        return response.arrayBuffer();
      });
      const [THREE, { GLTFLoader }, bytes] = await Promise.all([
        import("three"), import("three/addons/loaders/GLTFLoader.js"), model,
      ]);
      if (cancelled) return;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      const background = document.querySelector<HTMLElement>(".site-crt");
      // Only the glass writes clear pixels; the room fully masks the live page.
      renderer.setClearColor(0x0b0c0d, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.autoUpdate = false;
      dispose = () => {
        renderer.dispose();
        renderer.domElement.remove();
      };
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      stage.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
      const gltf = await new GLTFLoader().parseAsync(bytes, modelUrl.href);
      if (cancelled) {
        renderer.dispose();
        return;
      }
      scene.add(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
      const screen = gltf.scene.getObjectByName("Cube_CRTScreen_0") as import("three").Mesh | undefined;
      if (!screen) throw new Error("CRT screen mesh missing");

      // The transparent glass reveals the live CRT background and page beneath it.
      const originalMaterial = screen.material;
      screen.material = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending });
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      const center = bounds.getCenter(new THREE.Vector3());
      const screenCenter = new THREE.Box3().setFromObject(screen).getCenter(new THREE.Vector3());
      const screenSize = new THREE.Box3().setFromObject(screen).getSize(new THREE.Vector3());
      const normal = new THREE.Vector3(0, -1, 0).transformDirection(screen.matrixWorld);
      const cabinetHeight = bounds.max.y - bounds.min.y;
      const cabinet = gltf.scene.getObjectByName("Cube_TVCase_0");
      if (cabinet) cabinet.castShadow = true;

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(cabinetHeight * 30, cabinetHeight * 30),
        new THREE.MeshStandardMaterial({ color: 0x242323, roughness: 0.92 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(center.x, bounds.min.y - cabinetHeight * 0.002, center.z);
      floor.receiveShadow = true;
      scene.add(floor);
      scene.fog = new THREE.FogExp2(0x0b0c0d, 0.075 / cabinetHeight);
      scene.add(new THREE.HemisphereLight(0xadb9bf, 0x232221, 0.13));

      const lamp = new THREE.SpotLight(0xdcd0bf, 9 * cabinetHeight ** 2);
      lamp.position.copy(center).addScaledVector(normal, cabinetHeight * 0.62);
      lamp.position.x -= cabinetHeight * 0.38;
      lamp.position.y += cabinetHeight * 2;
      lamp.target.position.copy(center);
      lamp.angle = 0.55;
      lamp.penumbra = 0.82;
      lamp.castShadow = true;
      lamp.shadow.mapSize.set(1024, 1024);
      lamp.shadow.camera.near = cabinetHeight * 0.1;
      lamp.shadow.camera.far = cabinetHeight * 5;
      lamp.shadow.normalBias = cabinetHeight * 0.002;
      scene.add(lamp, lamp.target);
      // The wall catches the overhead lamp and a cool reflection from the tube.
      const shaft = new THREE.Mesh(
        new THREE.PlaneGeometry(cabinetHeight * 3, cabinetHeight * 2.5),
        new THREE.ShaderMaterial({
          uniforms: {
            tint: { value: new THREE.Color(0x272825) },
            wallTint: { value: new THREE.Color(0x171d20) },
            signalTint: { value: new THREE.Color(0x263438) },
            leftLight: { value: new THREE.Color(0x6b94a9) },
            rightLight: { value: new THREE.Color(0x738b82) },
            lightLevel: { value: 1 },
            powered: { value: 1 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 tint;
            uniform vec3 wallTint;
            uniform vec3 signalTint;
            uniform vec3 leftLight;
            uniform vec3 rightLight;
            uniform float lightLevel;
            uniform float powered;
            varying vec2 vUv;
            void main() {
              float fall = 1.0 - vUv.y;
              float offset = vUv.x - mix(0.37, 0.54, fall);
              float width = mix(0.035, 0.24, fall);
              float haze = exp(-2.0 * offset * offset / (width * width));
              float lampGlow = haze * vUv.y * vUv.y * 0.42;
              vec2 wall = (vUv - vec2(0.53, 0.34)) * vec2(3.8, 3.5);
              vec2 edges = min(vUv, 1.0 - vUv);
              float wallEdge = smoothstep(0.0, 0.20, min(edges.x, edges.y));
              float wallGlow = exp(-dot(wall, wall)) * wallEdge;
              vec3 wallColor = mix(wallTint, signalTint, powered);
              float wallAlpha = wallGlow * mix(0.22, 0.44, powered);
              float alpha = lampGlow + wallAlpha * (1.0 - lampGlow);
              vec3 color = wallColor * wallAlpha * (1.0 - lampGlow) + tint * lampGlow;

              vec2 left = (vUv - vec2(0.24, 0.73)) * vec2(6.5, 4.2);
              vec2 right = (vUv - vec2(0.81, 0.42)) * vec2(6.0, 4.6);
              float leftGlow = 0.24 * wallEdge * lightLevel * exp(-dot(left, left));
              float rightGlow = 0.20 * wallEdge * lightLevel * exp(-dot(right, right));
              color = color * (1.0 - leftGlow) + leftLight * leftGlow;
              color = color * (1.0 - rightGlow) + rightLight * rightGlow;
              alpha = 1.0 - (1.0 - alpha) * (1.0 - leftGlow) * (1.0 - rightGlow);
              color /= max(alpha, 0.001);
              gl_FragColor = vec4(color, alpha);
              #include <colorspace_fragment>
            }
          `,
          transparent: true,
          depthWrite: false,
        }),
      );
      shaft.position.copy(center).addScaledVector(normal, -cabinetHeight);
      shaft.position.y = floor.position.y + cabinetHeight * 1.25;
      shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      scene.add(shaft);
      initialTune();
      const records = createRecordWall(THREE);
      scene.add(records.wall);
      // Trace a reflected viewing ray to the tube and soften its footprint on the floor.
      const reflection = new THREE.Mesh(
        new THREE.PlaneGeometry(cabinetHeight * 10, cabinetHeight * 10),
        new THREE.ShaderMaterial({
          uniforms: {
            tube: { value: screenCenter },
            normal: { value: normal },
            tubeSize: { value: new THREE.Vector2(screenSize.x, screenSize.y) },
            cabinetHeight: { value: cabinetHeight },
            strength: { value: 1 },
          },
          vertexShader: `
            varying vec3 floorPoint;
            void main() {
              floorPoint = (modelMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * viewMatrix * vec4(floorPoint, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 tube;
            uniform vec3 normal;
            uniform vec2 tubeSize;
            uniform float cabinetHeight;
            uniform float strength;
            varying vec3 floorPoint;

            void main() {
              vec3 ray = reflect(normalize(floorPoint - cameraPosition), vec3(0.0, 1.0, 0.0));
              float direction = dot(ray, normal);
              float distance = dot(tube - floorPoint, normal) / min(direction, -0.001);
              vec3 hit = floorPoint + ray * distance - tube;
              vec3 tangent = cross(vec3(0.0, 1.0, 0.0), normal);
              vec2 image = abs(vec2(dot(hit, tangent), hit.y) / tubeSize);
              float edge = max(image.x, image.y);
              float spread = 1.0 - smoothstep(0.25, 0.8, edge);
              float front = smoothstep(0.03, 0.18, dot(floorPoint - tube, normal) / cabinetHeight);
              vec2 stone = (floorPoint - tube).xz / cabinetHeight;
              float mortar = smoothstep(0.004, 0.014, abs(fract(stone.x * 0.75 + 0.52) - 0.5));
              mortar *= smoothstep(0.003, 0.012, abs(fract(stone.y * 0.64 + 0.21) - 0.5));
              float surface = mix(0.35, 1.0, mortar);
              float reflected = step(0.0, distance) * step(direction, -0.001) * spread * front;
              float travel = distance / cabinetHeight;
              float falloff = 1.0 / (1.0 + travel * travel * 0.24);
              gl_FragColor = vec4(0.27, 0.51, 0.42, strength * reflected * falloff * surface * 0.72);
              #include <colorspace_fragment>
            }
          `,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      reflection.rotation.copy(floor.rotation);
      reflection.position.copy(floor.position);
      reflection.position.y += cabinetHeight * 0.001;
      scene.add(reflection);
      // The lamp and cabinet stay still while the camera moves.
      renderer.shadowMap.needsUpdate = true;
      const distance = Math.max(bounds.getSize(new THREE.Vector3()).length() * 1.35, 4);
      const start = new THREE.Vector3();
      const end = new THREE.Vector3();
      const startLook = center.clone().add(new THREE.Vector3(0, cabinetHeight * 0.035, 0));
      let width = 0;
      let height = 0;
      let entry = 0;
      const returnStart = () => entry - THREE.MathUtils.clamp(Math.round(entry * 0.13), 56, 104);
      const vertices = screen.geometry.getAttribute("position");
      const glass = Array.from({ length: vertices.count }, (_, index) =>
        new THREE.Vector3().fromBufferAttribute(vertices, index).applyMatrix4(screen.matrixWorld)
      );
      const aperture = new THREE.Box2();
      const pixel = new THREE.Vector2();
      const target = new THREE.Vector3();
      const render = (scrollY: number, progress: number) => {
        // Soften the ends of the zoom while the camera still tracks small scroll changes.
        const cameraProgress = THREE.MathUtils.lerp(progress, THREE.MathUtils.smoothstep(progress, 0, 1), 0.5);
        camera.position.lerpVectors(start, end, cameraProgress);
        camera.lookAt(target.copy(startLook).lerp(screenCenter, cameraProgress));
        camera.updateMatrixWorld();
        aperture.makeEmpty();
        for (const vertex of glass) {
          target.copy(vertex).project(camera);
          aperture.expandByPoint(pixel.set((1 + target.x) * width / 2, (1 - target.y) * height / 2));
        }
        // Keep the page at its responsive layout width. The cabinet clips the
        // excess, and each edge settles at its real viewport position.
        const left = Math.max(0, aperture.min.x - 1);
        const top = Math.max(0, aperture.min.y - 1);
        const right = Math.min(width, aperture.max.x + 1);
        const bottom = Math.min(height, aperture.max.y + 1);
        const screenWidth = right - left;
        const screenHeight = bottom - top;
        sceneElement.style.setProperty("--glass-left", `${left}px`);
        sceneElement.style.setProperty("--glass-top", `${top}px`);
        sceneElement.style.setProperty("--glass-width", `${screenWidth}px`);
        sceneElement.style.setProperty("--glass-height", `${screenHeight}px`);
        sceneElement.style.setProperty("--shutter-opacity", String(1 - THREE.MathUtils.smoothstep(progress, 0.10, 0.48)));
        const power = powerRef.current;
        if (power) {
          const available = progress < 0.32;
          sceneElement.dataset.tuning = String(available);
          if (!available && (document.activeElement === power || document.activeElement?.classList.contains("tv-arrow"))) enterRef.current?.focus({ preventScroll: true });
          power.disabled = !available;
        }
        const scale = screenWidth / width;
        // Fit the full CRT signal into the projected glass without resizing its GPU buffers.
        if (background) background.style.transform = `translate(${left}px, ${top}px) scale(${scale}, ${screenHeight / height})`;
        page.style.transform = `translate(${left}px, ${top + scrollY - entry}px) scale(${scale})`;
        page.style.setProperty("--screen-height", `${screenHeight / scale}px`);
        page.style.setProperty("--content-opacity", String(THREE.MathUtils.smoothstep(progress, 0.55, 1)));
        const navReveal = THREE.MathUtils.smoothstep(progress, 0.77, 0.98);
        page.style.setProperty("--nav-reveal", String(navReveal));
        page.style.setProperty("--nav-visibility", navReveal > 0 ? "visible" : "hidden");
        // On a narrow screen the two-line hero passes through the wordmark.
        // Clear that space earlier in the zoom, in both scroll directions.
        const logoFade = width < 700
          ? THREE.MathUtils.smoothstep(progress, 0.40, 0.65)
          : THREE.MathUtils.smoothstep(progress, 0.48, 0.82);
        logo.style.opacity = String(1 - logoFade);
        sceneElement.style.setProperty("--cue-opacity", String(1 - THREE.MathUtils.smoothstep(progress, 0.04, 0.32)));
        const powered = sceneElement.dataset.powered !== "false";
        const signal = powered ? 1 - THREE.MathUtils.smoothstep(progress, 0.03, 0.47) : 0;
        reflection.material.uniforms.strength.value = signal;
        shaft.material.uniforms.powered.value = signal;
        shaft.material.uniforms.lightLevel.value = 1 - THREE.MathUtils.smoothstep(progress, 0.08, 0.35);
        renderer.render(scene, camera);
      };
      let showing: boolean | undefined;
      let loadingArtwork = false;
      async function refreshArtwork() {
        if (!showing || document.hidden || loadingArtwork || request.signal.aborted) return;
        loadingArtwork = true;
        try {
          await records.load(request.signal, () => {
            if (showing && !document.hidden) renderer.render(scene, camera);
          });
        } catch {
          // Keep the current wall on a network failure. The next check retries.
        } finally {
          loadingArtwork = false;
        }
      }
      let returning = false;
      let settling = false;
      let lastScrollY = -1;
      let edgeTimer: number | undefined;
      const clearEdge = () => {
        window.clearTimeout(edgeTimer);
        page.classList.remove("crt-page-edge");
        page.style.removeProperty("--crt-edge-offset");
      };
      const clearPreview = () => {
        background?.style.removeProperty("transform");
        page.style.removeProperty("transform");
        page.style.removeProperty("--screen-height");
        page.style.removeProperty("--content-opacity");
        page.style.removeProperty("--nav-reveal");
        page.style.removeProperty("--nav-visibility");
      };

      function settle(duration: number) {
        const lenis = lenisRef.current;
        const top = entry;
        settling = true;
        if (lenis && Math.abs(lenis.actualScroll - lenis.animatedScroll) > 1) {
          // A native jump can arrive before Lenis has observed the new position.
          lenis.resize();
        }
        if (!duration || !lenis) {
          lenis?.scrollTo(top, { immediate: true, force: true });
          if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, behavior: "instant" });
          scroll(true);
          settling = false;
          return;
        }

        if (showing && window.scrollY >= top) {
          // A fast flick can cross the entire handoff in one frame.
          lenis.scrollTo(top - 24, { immediate: true, force: true });
        }
        lenis.scrollTo(top, {
          duration,
          easing: (progress) => 1 - (1 - progress) ** 3,
          lock: true,
          force: true,
          onComplete: () => { settling = false; },
        });
      }

      function settleEdge() {
        const lenis = lenisRef.current;
        // A busy frame must not cut short an upward gesture that is still in flight.
        if (lenis?.isTouching || lenis?.isScrolling === "smooth") {
          edgeTimer = window.setTimeout(settleEdge, 160);
        } else if (!showing && window.scrollY < entry - 1) {
          settle(0);
        }
      }

      let restoring = false;
      let scrollingBack = false;
      function scroll(force = false) {
        const scrollY = window.scrollY;
        if (!force && scrollY === lastScrollY) return;
        const movingDown = scrollY > lastScrollY;
        lastScrollY = scrollY;

        const span = returning ? returnStart() : entry;
        if (showing && !settling && movingDown && lenisRef.current && scrollY >= span * 0.9) {
          settle(0.42);
          if (scrollY >= entry) return;
        }

        const backingOut = showing === false && scrollY <= returnStart();
        // Touch viewports can settle just below the requested CSS pixel.
        const active = showing === false ? backingOut : scrollY < entry - 1;
        if (!active && scrollY < entry - 1) {
          // Keep the hero visually at its resting point until the visitor commits to leaving it.
          window.clearTimeout(edgeTimer);
          page.classList.add("crt-page-edge");
          page.style.setProperty("--crt-edge-offset", `${scrollY - entry}px`);
          if (!settling) edgeTimer = window.setTimeout(settleEdge, 160);
        } else {
          clearEdge();
        }

        if (active !== showing) {
          const wasShowing = showing;
          showing = active;
          if (active) void refreshArtwork();
          returning = backingOut;
          page.classList.toggle("crt-page-preview", active);
          page.inert = active;
          page.dataset.crtIntro = active ? "active" : wasShowing ? "entered" : "ready";
          setInIntro(active);
          if (backingOut && !restoring && location.pathname !== "/") {
            scrollingBack = true;
            reopen();
          }
          if (!active) {
            settling = false;
            clearPreview();
            if (wasShowing) {
              if (!restoring) commitEntry();
              rememberChannelVisit();
              document.getElementById("main")?.focus({ preventScroll: true });
            }
          }
        }
        if (active) render(scrollY, THREE.MathUtils.clamp(scrollY / (returning ? returnStart() : entry), 0, 1));
      }
      const onNativeScroll = () => scroll();
      const resize = () => {
        width = stage.clientWidth;
        height = stage.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.fov = width < 700 ? 52 : 35;
        const startDistance = distance * Math.max(1.34, 0.68 / camera.aspect);
        start.copy(center).addScaledVector(normal, startDistance).add(new THREE.Vector3(-distance * 0.38, distance * 0.04, 0));
        // Anchor the sleeves to the back wall at the floor line during the zoom.
        const wallNormal = start.clone().sub(center).setY(0).normalize();
        records.wall.position.copy(center).addScaledVector(wallNormal, -cabinetHeight * 0.82);
        records.wall.position.y = floor.position.y + cabinetHeight * 0.01;
        records.wall.rotation.y = Math.atan2(wallNormal.x, wallNormal.z);
        records.wall.scale.setScalar(cabinetHeight * (width < 700 ? 0.54 : 0.49));
        // Stop when the glass fills both axes. Traveling farther leaves the
        // visitor scrolling over a full-size page whose links are still inert.
        const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
        const fitDistance = Math.min(screenSize.y, screenSize.x / camera.aspect) / (2 * Math.tan(halfFov));
        end.copy(screenCenter).addScaledVector(normal, fitDistance * 0.96);
        camera.updateProjectionMatrix();
        entry = Math.round(height * 0.78);
        page.style.marginTop = `${entry}px`;
      };
      const startOnPage = Boolean(
        window.location.hash || (!document.getElementById("tv-startup")?.hasAttribute("open") &&
          (window.scrollY || page.contains(document.activeElement) || page.querySelector('.nav-search[aria-expanded="true"]'))),
      );
      const initialScroll = window.scrollY;
      resize();
      if (startOnPage) window.scrollTo({ top: initialScroll + entry, behavior: "instant" });
      lenisRef.current?.resize();
      scroll();
      const artworkTimer = window.setInterval(refreshArtwork, 60_000);
      if (startOnPage) startup?.close();
      syncIntroRef.current = scroll;
      settleRef.current = settle;
      const onResize = () => {
        const offset = window.scrollY - entry;
        resize();
        if (!showing) window.scrollTo({ top: entry + Math.max(0, offset), behavior: "instant" });
        lenisRef.current?.resize();
        if (settling) settle(0);
        scroll(true);
      };
      // The entry is recorded at the end of the camera travel. Native history
      // restoration would otherwise replay that scroll after Back opens the shop.
      const previousRestoration = history.scrollRestoration;
      history.scrollRestoration = "manual";
      const onHistory = () => {
        if (!["/", ...channels.map(item => item.href)].includes(location.pathname)) return;
        if (scrollingBack && location.pathname === "/") {
          scrollingBack = false;
          return;
        }
        restoreRoute();
        restoring = true;
        const section = location.hash && document.getElementById(location.hash.slice(1));
        if (section) {
          section.scrollIntoView({ behavior: "instant" });
        } else {
          const top = location.pathname === "/" ? 0 : entry;
          lenisRef.current?.scrollTo(top, { immediate: true, force: true });
          window.scrollTo({ top, behavior: "instant" });
        }
        scroll(true);
        restoring = false;
      };
      window.addEventListener("popstate", onHistory);
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onNativeScroll, { passive: true });
      const onVisibilityChange = () => {
        if (!document.hidden) {
          scroll(true);
          void refreshArtwork();
        }
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
      dispose = () => {
        history.scrollRestoration = previousRestoration;
        window.removeEventListener("popstate", onHistory);
        window.removeEventListener("resize", onResize);
        window.clearInterval(artworkTimer);
        records.dispose();
        window.removeEventListener("scroll", onNativeScroll);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        syncIntroRef.current = null;
        settleRef.current = null;
        clearEdge();
        page.style.removeProperty("margin-top");
        page.inert = false;
        reflection.geometry.dispose();
        reflection.material.dispose();
        shaft.geometry.dispose();
        shaft.material.dispose();
        lamp.dispose();
        floor.geometry.dispose();
        floor.material.dispose();
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material.dispose());
          }
        });
        (Array.isArray(originalMaterial) ? originalMaterial : [originalMaterial]).forEach((material) => material.dispose());
        page.classList.remove("crt-page-preview");
        clearPreview();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }
    void setup().catch(onContextLoss);
    return () => {
      cancelled = true;
      window.removeEventListener("tv-startup-skip", skip);
      startup?.close();
      request.abort();
      stage.removeEventListener("webglcontextlost", onContextLoss, true);
      const restoreFocus = page.inert;
      dispose();
      if (restoreFocus) document.getElementById("main")?.focus({ preventScroll: true });
      delete page.dataset.crtIntro;
    };
  }, [enabled, skipScene, unavailable]);

  useLayoutEffect(() => {
    if (!enabled || !inIntro) return;
    const focusControls = (keepSkip: boolean) => {
      if (keepSkip && skipRef.current) {
        skipRef.current.hidden = false;
        skipRef.current.focus({ preventScroll: true });
      } else {
        enterRef.current?.focus({ preventScroll: true });
      }
    };
    if (window.cxsTvStartup) window.cxsTvStartup.ready(focusControls);
    else focusControls(false);
  }, [enabled, inIntro]);

  useEffect(() => {
    syncIntroRef.current?.(true);
  }, [poweredOn, selected.name]);

  if (!displayed || (pathname !== "/" && !direct)) return null;
  return <>
    <ChannelArrival />
    {panels[displayed.id]}
    {enabled && createPortal(
    <div
      className="crt-intro"
      role="dialog"
      aria-modal={inIntro || undefined}
      aria-label="TV channel selector"
      aria-hidden={!inIntro}
      style={{ visibility: inIntro ? "visible" : "hidden" }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          if (event.currentTarget.querySelector('[data-tuning="true"]')) tune(event.key === "ArrowRight" ? 1 : -1);
        } else if (event.key === "Escape") {
          event.preventDefault();
          settleRef.current?.(0);
        } else if (event.key === "Tab") {
          event.preventDefault();
          event.currentTarget.dataset.keyboardCue = "";
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a:not([hidden])"))
            .filter(control => control.getClientRects().length && getComputedStyle(control).visibility === "visible");
          const current = controls.findIndex((control) => control === document.activeElement);
          const offset = event.shiftKey ? -1 : 1;
          controls[(current + offset + controls.length) % controls.length]?.focus({ preventScroll: true });
        }
      }}
      onWheel={(event) => { delete event.currentTarget.dataset.keyboardCue; }}
      onPointerDown={(event) => { delete event.currentTarget.dataset.keyboardCue; }}
    >
        <a ref={skipRef} className="tv-startup-skip" href="#main" hidden
          onClick={event => { event.preventDefault(); window.cxsTvStartup?.fallback(); }}
          onBlur={event => { event.currentTarget.hidden = true; }}>
          Skip to portfolio
        </a>
        <div className="crt-intro-scene" data-powered={poweredOn}>
          <div className="crt-intro-logo" ref={logoRef} aria-hidden="true">
            <div key={selected.id} className="crt-channel-roll" data-direction={tuned.roll?.direction}
              onAnimationEnd={() => setTuned(current => current === tuned ? { id: current.id } : current)}>
              {tuned.roll && <span className="crt-channel-outgoing">{tuned.roll.from}</span>}
              <span>{selected.name}</span>
            </div>
          </div>
          <div className="crt-glass-shutter" aria-hidden="true" />
          <div className="crt-intro-stage" ref={stageRef} aria-hidden="true" />
          <div className="tv-readouts">
            <span className="tv-status" data-on={poweredOn}>TV {poweredOn ? "ON" : "OFF"}</span>
            <span className="tv-channel-count">
              <span className="sr-only">Channel {position} of {available.length}</span>
              <span aria-hidden="true">CH {String(position).padStart(2, "0")} / {String(available.length).padStart(2, "0")}</span>
            </span>
            {inIntro && <VisitClock />}
            <span className="tv-owner">Carlos Sosa</span>
          </div>
          <span className="sr-only" role="status">{inIntro ? selected.name : ""}</span>
          {available.length > 1 && ([-1, 1] as const).map(direction =>
            <button type="button" key={direction} className={direction < 0 ? "tv-arrow tv-prev" : "tv-arrow tv-next"}
              aria-label={direction < 0 ? "Previous channel" : "Next channel"}
              disabled={!poweredOn} onClick={() => tune(direction)}>
              <HugeiconsIcon icon={direction < 0 ? ArrowLeft01Icon : ArrowRight01Icon} size={26} aria-hidden="true" />
            </button>
          )}
          <div className="crt-power-area">
            <button
              ref={powerRef}
              className="crt-power"
              type="button"
              aria-pressed={poweredOn}
              onClick={() => setPoweredOn((previous) => !previous)}
            >
              <span className="crt-power-label">
                <span className="crt-power-click">Click</span><span className="crt-power-tap">Tap</span> to turn <strong>ON/OFF</strong>
              </span>
            </button>
          </div>
          <div className="crt-intro-controls">
            <p>Scroll to enter</p>
            <button ref={enterRef} type="button" onClick={() => settleRef.current?.(0.86)}>Enter {selected.name}</button>
          </div>
        </div>
    </div>, document.body,
  )}</>;
}
