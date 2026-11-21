"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type Lenis from "lenis";
import Noise from "@/components/backgrounds/Noise";

const sessionKey = "cxs-crt-intro-seen";

const motionQuery = "(prefers-reduced-motion: no-preference)";

function subscribe(update: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

export function CrtIntro() {
  const enabled = useSyncExternalStore(subscribe, () => window.matchMedia(motionQuery).matches, () => false);
  const [inIntro, setInIntro] = useState(false);
  const [poweredOn, setPoweredOn] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const powerRef = useRef<HTMLButtonElement>(null);
  const distanceRef = useRef(0);
  const lenisRef = useRef<Lenis | null>(null);
  const syncIntroRef = useRef<((force?: boolean) => void) | null>(null);

  function skipIntro() {
    const top = distanceRef.current;
    lenisRef.current?.scrollTo(top, { immediate: true, force: true });
    if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, behavior: "instant" });
    syncIntroRef.current?.(true);
  }

  function enterPortfolio() {
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(distanceRef.current, { duration: 0.95, onComplete: skipIntro });
    else skipIntro();
  }

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    void import("lenis").then(({ default: SmoothScroll }) => {
      if (cancelled) return;
      const lenis = new SmoothScroll({
        autoRaf: true,
        anchors: true,
        smoothWheel: window.matchMedia("(pointer: fine)").matches,
        lerp: 0.085,
        prevent: (node) => Boolean(node.closest(".search-overlay, select, textarea")),
      });
      lenis.on("scroll", () => syncIntroRef.current?.());
      lenisRef.current = lenis;
    }).catch(() => {});

    return () => {
      cancelled = true;
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !stageRef.current || !logoRef.current) return;
    const stage = stageRef.current;
    const logo = logoRef.current;
    const sceneElement = stage.parentElement!;
    const request = new AbortController();
    let cancelled = false;
    let dispose = () => {};

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
      const page = document.getElementById("portfolio-page")!;
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
            lightTime: { value: 0 },
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
            uniform float lightTime;
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

              vec2 left = (vUv - vec2(0.24 + 0.065 * sin(lightTime * 0.43),
                0.61 + 0.12 * cos(lightTime * 0.36))) * vec2(6.5, 4.2);
              vec2 right = (vUv - vec2(0.76 + 0.06 * sin(lightTime * 0.34 + 2.1),
                0.47 + 0.10 * cos(lightTime * 0.41 + 2.1))) * vec2(6.0, 4.6);
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
              float grain = fract(sin(dot(floor(stone * 230.0), vec2(12.9898, 78.233))) * 43758.5453);
              float mortar = smoothstep(0.004, 0.014, abs(fract(stone.x * 0.75 + 0.52) - 0.5));
              mortar *= smoothstep(0.003, 0.012, abs(fract(stone.y * 0.64 + 0.21) - 0.5));
              float surface = mix(0.35, 1.0, mortar) * mix(0.72, 1.0, grain);
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
      const vertices = screen.geometry.getAttribute("position");
      const glass = Array.from({ length: vertices.count }, (_, index) =>
        new THREE.Vector3().fromBufferAttribute(vertices, index).applyMatrix4(screen.matrixWorld)
      );
      const aperture = new THREE.Box2();
      const pixel = new THREE.Vector2();
      const target = new THREE.Vector3();
      const render = (scrollY: number, progress: number) => {
        camera.position.lerpVectors(start, end, progress);
        camera.lookAt(target.copy(startLook).lerp(screenCenter, progress));
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
        const roomVisibility = 1 - THREE.MathUtils.smoothstep(progress, 0.08, 0.48);
        sceneElement.style.setProperty("--room-noise-visibility", String(roomVisibility));
        sceneElement.style.setProperty("--room-noise-display", roomVisibility > 0 ? "block" : "none");
        sceneElement.style.setProperty("--shutter-opacity", String(1 - THREE.MathUtils.smoothstep(progress, 0.10, 0.48)));
        const power = powerRef.current;
        if (power) {
          const available = progress < 0.32;
          if (!available && document.activeElement === power) enterRef.current?.focus({ preventScroll: true });
          power.disabled = !available;
        }
        const scale = screenWidth / width;
        // Fit the full CRT signal into the projected glass without resizing its GPU buffers.
        if (background) background.style.transform = `translate(${left}px, ${top}px) scale(${scale}, ${screenHeight / height})`;
        page.style.transform = `translate(${left}px, ${top + scrollY - distanceRef.current}px) scale(${scale})`;
        page.style.setProperty("--screen-height", `${screenHeight / scale}px`);
        page.style.setProperty("--content-opacity", String(THREE.MathUtils.smoothstep(progress, 0.55, 1)));
        const x = (left + right) / 2;
        const y = (top + bottom) / 2;
        logo.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale * width / 480})`;
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
      let wallLightsTimer: number | undefined;
      function stopWallLights() {
        window.clearInterval(wallLightsTimer);
        wallLightsTimer = undefined;
      }
      function syncWallLights() {
        if (document.hidden || window.scrollY > 1) {
          stopWallLights();
        } else if (wallLightsTimer === undefined) {
          // Drift slowly at rest and let scroll-driven frames take over during entry.
          wallLightsTimer = window.setInterval(() => {
            shaft.material.uniforms.lightTime.value += 0.1;
            renderer.render(scene, camera);
          }, 100);
        }
      }
      let showing: boolean | undefined;
      let lastScrollY = -1;
      const scroll = (force = false) => {
        const scrollY = window.scrollY;
        if (!force && scrollY === lastScrollY) return;
        lastScrollY = scrollY;
        const progress = THREE.MathUtils.clamp(scrollY / distanceRef.current, 0, 1);
        // Touch viewports can settle just below the requested CSS pixel.
        const active = scrollY < distanceRef.current - 1;
        if (active !== showing) {
          const wasShowing = showing;
          showing = active;
          page.classList.toggle("crt-page-preview", active);
          page.inert = active;
          setInIntro(active);
          if (!active) {
            background?.style.removeProperty("transform");
            page.style.removeProperty("transform");
            page.style.removeProperty("--screen-height");
            page.style.removeProperty("--content-opacity");
            if (wasShowing) {
              try { sessionStorage.setItem(sessionKey, "1"); } catch { /* Storage is optional. */ }
              document.getElementById("main")?.focus({ preventScroll: true });
            }
          }
        }
        if (active) render(scrollY, progress);
        syncWallLights();
      };
      const onNativeScroll = () => scroll();
      const resize = () => {
        width = stage.clientWidth;
        height = stage.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.fov = width < 700 ? 52 : 35;
        const startDistance = distance * Math.max(1.24, 0.65 / camera.aspect);
        start.copy(center).addScaledVector(normal, startDistance).add(new THREE.Vector3(-distance * 0.38, distance * 0.04, 0));
        // Stop when the glass fills both axes. Traveling farther leaves the
        // visitor scrolling over a full-size page whose links are still inert.
        const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
        const fitDistance = Math.min(screenSize.y, screenSize.x / camera.aspect) / (2 * Math.tan(halfFov));
        end.copy(screenCenter).addScaledVector(normal, fitDistance * 0.96);
        camera.updateProjectionMatrix();
        distanceRef.current = Math.round(height * 0.78);
        page.style.marginTop = distanceRef.current + "px";
      };
      // A slow model download can arrive after the visitor has started reading.
      // Keep that page in place and let them scroll up to see the television.
      const download = performance.getEntriesByName(modelUrl.href, "resource").at(-1);
      const lateModel = (download?.duration ?? 0) > 1800;
      let startOnPage = lateModel || Boolean(
        window.scrollY || window.location.hash || page.contains(document.activeElement) ||
          page.querySelector('.dock-search[aria-expanded="true"]'),
      );
      try { startOnPage ||= Boolean(sessionStorage.getItem(sessionKey)); } catch { /* Storage is optional. */ }
      const initialScroll = window.scrollY;
      resize();
      if (startOnPage) window.scrollTo({ top: initialScroll + distanceRef.current, behavior: "instant" });
      lenisRef.current?.resize();
      scroll();
      syncIntroRef.current = scroll;
      const onResize = () => {
        const offset = window.scrollY - distanceRef.current;
        resize();
        if (offset >= -1) window.scrollTo({ top: distanceRef.current + Math.max(0, offset), behavior: "instant" });
        lenisRef.current?.resize();
        scroll(true);
      };
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onNativeScroll, { passive: true });
      document.addEventListener("visibilitychange", syncWallLights);
      dispose = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onNativeScroll);
        document.removeEventListener("visibilitychange", syncWallLights);
        stopWallLights();
        syncIntroRef.current = null;
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
        background?.style.removeProperty("transform");
        page.classList.remove("crt-page-preview");
        page.style.removeProperty("transform");
        page.style.removeProperty("--screen-height");
        page.style.removeProperty("--content-opacity");
        renderer.dispose();
        renderer.domElement.remove();
      };
    }
    void setup().catch(() => { if (!cancelled) dispose(); });
    return () => { cancelled = true; request.abort(); dispose(); };
  }, [enabled]);

  useEffect(() => {
    if (enabled && inIntro) enterRef.current?.focus({ preventScroll: true });
  }, [enabled, inIntro]);

  useEffect(() => {
    syncIntroRef.current?.(true);
  }, [poweredOn]);

  if (!enabled) return null;
  return createPortal(
    <div
      className="crt-intro"
      role="dialog"
      aria-modal={inIntro || undefined}
      aria-label="Enter the portfolio"
      aria-hidden={!inIntro}
      style={{ visibility: inIntro ? "visible" : "hidden" }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          skipIntro();
        } else if (event.key === "Tab") {
          event.preventDefault();
          event.currentTarget.dataset.keyboardCue = "";
          const controls = [powerRef.current, enterRef.current]
            .filter((control): control is HTMLButtonElement => Boolean(control && !control.disabled));
          const current = controls.findIndex((control) => control === document.activeElement);
          const offset = event.shiftKey ? -1 : 1;
          controls[(current + offset + controls.length) % controls.length]?.focus({ preventScroll: true });
        }
      }}
      onWheel={(event) => { delete event.currentTarget.dataset.keyboardCue; }}
      onPointerDown={(event) => { delete event.currentTarget.dataset.keyboardCue; }}
    >
        <div className="crt-intro-scene" data-powered={poweredOn}>
          <div className="wordmark crt-intro-logo" ref={logoRef} aria-hidden="true">
            <span className="brand-mark" />CXS<span className="wordmark-period">.</span>
          </div>
          <div className="crt-glass-shutter" aria-hidden="true" />
          <div className="crt-intro-stage" ref={stageRef} aria-hidden="true" />
          {inIntro && (
            <Noise
              opacity={0.5}
              size={1}
              fps={30}
              blendMode="overlay"
              contrast={1}
              colored={false}
              dust={0.1}
              scratches={0}
              scanlines={0.4}
              flicker={0.25}
            />
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
            <button ref={enterRef} type="button" onClick={enterPortfolio}>Enter portfolio</button>
          </div>
        </div>
    </div>, document.body,
  );
}
