"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type TextTypeProps = {
  text: readonly string[];
  typingSpeed: number;
  pauseDuration: number;
  deletingSpeed: number;
  mistakes: number;
  variableSpeed?: { min: number; max: number };
};

type TypingFrame = { count: number; from: number; mistake?: string; backspace?: boolean };

const keyboardRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

function adjacentKey(character: string) {
  const lower = character.toLowerCase();
  const row = keyboardRows.find(keys => keys.includes(lower));
  if (!row) return;
  const index = row.indexOf(lower);
  const next = index === row.length - 1 || (index > 0 && Math.random() < 0.5) ? index - 1 : index + 1;
  return character === lower ? row[next] : row[next].toUpperCase();
}

export function TextType({ text, typingSpeed, pauseDuration, deletingSpeed, mistakes, variableSpeed }: TextTypeProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState<TypingFrame | null>(null);
  const lines = useMemo(() => text.map(line => Array.from(line)), [text]);
  const characters = useMemo(() => lines.flat(), [lines]);
  const minSpeed = variableSpeed?.min ?? typingSpeed;
  const maxSpeed = variableSpeed?.max ?? typingSpeed;

  useEffect(() => {
    const root = ref.current;
    if (!root || !characters.length) return;
    const page = root.closest<HTMLElement>("#portfolio-page");
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let visible = false;
    let started = false;
    let running = false;
    let from = 0;
    let timeout: number | undefined;
    let corrected = 0;
    const speed = () => minSpeed + Math.random() * (maxSpeed - minSpeed);
    const wait = (delay: number, step: () => void) => { timeout = window.setTimeout(step, delay); };
    const finish = () => { window.clearTimeout(timeout); setFrame(null); };
    const show = (count: number, details?: Pick<TypingFrame, "mistake" | "backspace">) => {
      setFrame({ count, from, ...details });
    };

    function type(count: number) {
      if (count === characters.length) {
        wait(pauseDuration, repeat);
        return;
      }
      const append = () => {
        show(count + 1);
        type(count + 1);
      };
      wait(speed(), () => {
        const mistake = count > 0 && corrected < 2 && Math.random() < mistakes * 0.16
          ? adjacentKey(characters[count])
          : undefined;
        if (!mistake) {
          append();
          return;
        }
        corrected++;
        show(count, { mistake });
        wait(180 + deletingSpeed, () => {
          show(count, { backspace: true });
          wait(speed(), append);
        });
      });
    }

    function backspace(count: number, stop: number) {
      if (count === stop) {
        from = stop;
        type(count);
        return;
      }
      wait(deletingSpeed, () => {
        show(count - 1, { backspace: true });
        backspace(count - 1, stop);
      });
    }

    function repeat() {
      corrected = 0;
      backspace(characters.length, 0);
    }

    const update = () => {
      const stage = page?.dataset.crtIntro;
      if (!started && stage === "active") root.dataset.awaitingEntry = "";
      const ready = !page || stage === "ready" || stage === "entered";
      if (!ready || !visible || document.hidden || !motion.matches) {
        if (running) {
          running = false;
          finish();
        }
        return;
      }
      if (running) return;
      running = true;
      if (started) {
        from = characters.length;
        wait(pauseDuration, repeat);
        return;
      }
      started = true;
      root.dataset.played = "";
      if (!page || stage === "entered") {
        show(0);
        type(0);
      } else {
        // Ease into the loop by retyping just the final word on a return visit.
        from = characters.lastIndexOf(" ") + 1;
        show(characters.length, { backspace: true });
        backspace(characters.length, from);
      }
    };

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    }, { threshold: 0.5 });
    visibility.observe(root);
    const intro = new MutationObserver(update);
    if (page) intro.observe(page, { attributeFilter: ["data-crt-intro"] });
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearTimeout(timeout);
      visibility.disconnect();
      intro.disconnect();
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [characters, deletingSpeed, maxSpeed, minSpeed, mistakes, pauseDuration]);

  useLayoutEffect(() => {
    if (frame && ref.current) delete ref.current.dataset.awaitingEntry;
  }, [frame]);

  let index = 0;
  const caret = frame?.mistake ? frame.count : Math.max(0, (frame?.count ?? 0) - 1);
  return (
    <span className="text-type" aria-hidden="true" ref={ref}>
      {lines.map((line, lineIndex) => (
        <span className={lineIndex === 0 ? "text-type__line" : "hero-title-continuation"} key={lineIndex}>
          {line.map(character => {
            const slot = index++;
            const mistake = frame && slot === frame.count ? frame.mistake : undefined;
            const typed = frame && slot < frame.count;
            const cursor = frame && slot === caret ? (
              <span
                className="text-type__cursor"
                data-start={frame.count === 0 && !mistake ? "" : undefined}
                data-glide={!frame.backspace && (frame.count || mistake) ? "" : undefined}
                data-idle={frame.count === characters.length && !frame.backspace ? "" : undefined}
              />
            ) : null;
            return (
              <span
                className="text-type__slot"
                key={slot}
                data-pending={frame && !typed && !mistake ? "" : undefined}
              >
                <span className="text-type__letter" data-rise={typed && slot >= frame.from ? "" : undefined} data-mistyped={mistake ? "" : undefined}>
                  {character}
                </span>
                {mistake ? <span className="text-type__mistake" data-rise>{mistake}{cursor}</span> : cursor}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
