"use client";
import { useEffect, useRef } from "react";

// Brand palette stops: [r, g, b]
const RED = [193, 18, 31] as const; // #c1121f — core (0–60 px)
const CRIMSON = [120, 0, 0] as const; // #780000 — mid  (60–150 px)
const STEEL = [102, 155, 188] as const; // #669bbc — edge (150–250 px)
const IDLE_RGB = [120, 0, 0] as const; // crimson at rest

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}
function lerpColor(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  amount: number,
) {
  return [
    lerp(from[0], to[0], amount),
    lerp(from[1], to[1], amount),
    lerp(from[2], to[2], amount),
  ] as const;
}

/** Returns interpolated [r,g,b] for a given distance 0→250. */
function colorForDistance(distance: number): readonly [number, number, number] {
  if (distance <= 60) return lerpColor(RED, CRIMSON, distance / 60);
  if (distance <= 150) return lerpColor(CRIMSON, STEEL, (distance - 60) / 90);
  return lerpColor(STEEL, IDLE_RGB, Math.min(1, (distance - 150) / 100));
}

interface Heart {
  element: HTMLSpanElement;
  x: number;
  y: number;
  phase: number;
  activatedAt: number;
  // lerp targets (set when pointer is near)
  opacity: number;
  boost: number;
  floatY: number;
  distance: number;
  // smoothed current values
  currentOpacity: number;
  currentBoost: number;
  currentFloatY: number;
  currentR: number;
  currentG: number;
  currentB: number;
}

interface Pointer {
  x: number;
  y: number;
  time: number;
}

const IDLE_OP = 0.1;
const LINGER = 1300; // ms until ripple fades back to idle
const LERP_SPD = 0.09; // ~11 frames to reach target

export function HeartGrid() {
  const layerRef = useRef<HTMLDivElement>(null);
  const heartsRef = useRef<Heart[]>([]);
  const pointersRef = useRef<Pointer[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const SPACING = window.innerWidth < 540 ? 40 : 36;

    function build() {
      if (!layer) return;
      layer.innerHTML = "";
      heartsRef.current = [];
      const cols = Math.ceil(window.innerWidth / SPACING) + 1;
      const rows = Math.ceil(window.innerHeight / SPACING) + 1;
      const fragment = document.createDocumentFragment();
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const element = document.createElement("span");
          element.textContent = "♥";
          const x = col * SPACING + SPACING / 2;
          const y = row * SPACING + SPACING / 2;
          element.style.cssText = `position:absolute;font-size:15px;line-height:1;user-select:none;will-change:transform,color;left:${x}px;top:${y}px;transform:translate(-50%,-50%)`;
          fragment.appendChild(element);
          heartsRef.current.push({
            element,
            x,
            y,
            phase: (col + row) * 0.35,
            activatedAt: -1e9,
            opacity: IDLE_OP,
            boost: 0,
            floatY: 0,
            distance: 999,
            currentOpacity: IDLE_OP,
            currentBoost: 0,
            currentFloatY: 0,
            currentR: IDLE_RGB[0],
            currentG: IDLE_RGB[1],
            currentB: IDLE_RGB[2],
          });
        }
      }
      layer.appendChild(fragment);
    }
    build();

    const onResize = () => build();
    window.addEventListener("resize", onResize);

    // ── Pointer tracking ──────────────────────────────────────────
    function setFromMouse(event: MouseEvent) {
      pointersRef.current = [
        { x: event.clientX, y: event.clientY, time: performance.now() },
      ];
    }
    function setFromTouch(event: TouchEvent) {
      const pointers: Pointer[] = [];
      for (let index = 0; index < event.touches.length; index++)
        pointers.push({
          x: event.touches[index].clientX,
          y: event.touches[index].clientY,
          time: performance.now(),
        });
      pointersRef.current = pointers;
    }
    function clearPointers() {
      pointersRef.current.forEach((pointer) => {
        pointer.time = performance.now() - 9999;
      });
    }

    window.addEventListener(
      "pointermove",
      (event: PointerEvent) => {
        if (event.pointerType === "mouse") setFromMouse(event);
      },
      { passive: true },
    );
    window.addEventListener("mouseleave", clearPointers);
    window.addEventListener("touchstart", setFromTouch, { passive: true });
    window.addEventListener("touchmove", setFromTouch, { passive: true });
    window.addEventListener(
      "touchend",
      (event: TouchEvent) => {
        if (event.touches.length === 0) clearPointers();
        else setFromTouch(event);
      },
      { passive: true },
    );

    // ── RAF loop ──────────────────────────────────────────────────
    const start = performance.now();

    function frame(now: number) {
      const elapsedSeconds = (now - start) / 1000;
      const pointers = pointersRef.current;
      const hearts = heartsRef.current;

      for (let index = 0; index < hearts.length; index++) {
        const heart = hearts[index];

        // Find nearest active pointer
        let nearest = Infinity;
        for (
          let pointerIndex = 0;
          pointerIndex < pointers.length;
          pointerIndex++
        ) {
          if (now - pointers[pointerIndex].time > 200) continue;
          const distance = Math.hypot(
            heart.x - pointers[pointerIndex].x,
            heart.y - pointers[pointerIndex].y,
          );
          if (distance < nearest) nearest = distance;
        }

        // Set targets when inside ripple radius
        if (nearest < 250) {
          heart.activatedAt = now;
          heart.distance = nearest;
          if (nearest < 60) {
            heart.opacity = 0.55;
            heart.boost = 1.3;
            heart.floatY = -7;
          } else if (nearest < 150) {
            heart.opacity = 0.45;
            heart.boost = 0.5;
            heart.floatY = -3;
          } else {
            heart.opacity = 0.3;
            heart.boost = 0.1;
            heart.floatY = 0;
          }
        }

        // Linger fade: ease 1→0 over LINGER ms after pointer leaves
        const linger = Math.max(0, 1 - (now - heart.activatedAt) / LINGER);
        const ease = linger * linger * (3 - 2 * linger); // smooth-step

        const targetOpacity = IDLE_OP + (heart.opacity - IDLE_OP) * ease;
        const targetBoost = heart.boost * ease;
        const targetFloatY = heart.floatY * ease;

        // Lerp current → target (smooth, no snap)
        heart.currentOpacity +=
          (targetOpacity - heart.currentOpacity) * LERP_SPD;
        heart.currentBoost += (targetBoost - heart.currentBoost) * LERP_SPD;
        heart.currentFloatY += (targetFloatY - heart.currentFloatY) * LERP_SPD;

        // Color: lerp toward palette stop for current distance
        const [targetR, targetG, targetB] =
          ease > 0.01
            ? colorForDistance(heart.distance * (1 - ease * 0.3)) // slightly shift dist inward at peak
            : IDLE_RGB;
        heart.currentR += (targetR - heart.currentR) * LERP_SPD;
        heart.currentG += (targetG - heart.currentG) * LERP_SPD;
        heart.currentB += (targetB - heart.currentB) * LERP_SPD;

        // Idle breathing
        const breathe = 1 + Math.sin(elapsedSeconds * 1.4 + heart.phase) * 0.08;
        const scale = (1 + heart.currentBoost) * breathe;
        const floatY = heart.currentFloatY;

        heart.element.style.transform = `translate(-50%, calc(-50% + ${floatY.toFixed(1)}px)) scale(${scale.toFixed(3)})`;
        heart.element.style.color = `rgba(${heart.currentR.toFixed(0)},${heart.currentG.toFixed(0)},${heart.currentB.toFixed(0)},${heart.currentOpacity.toFixed(3)})`;
      }

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden touch-pan-y pointer-events-none"
    />
  );
}
