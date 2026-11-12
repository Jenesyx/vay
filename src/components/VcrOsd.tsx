"use client";

// The page behaves like a tape deck: scroll fast and the VCR shows ▶▶ / ◀◀
// with a tracking band tearing across the screen. Also hosts the shabash
// counter (a button: press it to throw from the counter).

import { useEffect, useRef, useState } from "react";
import { getLenis } from "./SmoothScroll";
import { emit, on, stage } from "@/lib/stage";
import { faNum } from "@/lib/fa";

export function VcrOsd() {
  const osd = useRef<HTMLSpanElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => on<number>("shabash", setCount), []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let level = 0;
    let rewinding = false;
    let lastY = window.scrollY;
    const off = on<boolean>("rewind", (r) => (rewinding = r));
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const lenis = getLenis();
      const v = lenis ? lenis.velocity : window.scrollY - lastY;
      lastY = window.scrollY;
      const speed = Math.abs(v);
      const target = rewinding ? 1 : speed > 22 ? Math.min(1, (speed - 22) / 40) : 0;
      level += (target - level) * 0.18;
      const el = osd.current!;
      const b = band.current!;
      if (level < 0.02) {
        if (el.style.opacity !== "0") {
          el.style.opacity = "0";
          b.style.opacity = "0";
        }
        return;
      }
      const backwards = rewinding || v < 0;
      el.textContent = backwards ? "◀◀ REW" : "▶▶ FF";
      el.style.opacity = String(Math.min(1, level * 1.6));
      b.style.opacity = String(level * 0.9);
      b.style.transform = `translateY(${(performance.now() * (backwards ? -1.4 : 1.4)) % window.innerHeight}px)`;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      off();
    };
  }, []);

  return (
    <>
      <div className="vcr-layer" aria-hidden>
        <div ref={band} className="vcr-band" />
        <span ref={osd} className="vcr-osd" />
      </div>
      <button
        className="shabash-counter"
        onClick={(e) => {
          if (!stage.started) return;
          const r = e.currentTarget.getBoundingClientRect();
          emit("throw", { x: r.left + r.width / 2, y: r.bottom, n: 12 });
        }}
        aria-label={`Throw shabash. You have thrown ${count} dollars`}
      >
        <span dir="rtl">شاباش: {faNum(count)} دلار</span>
        <span className="en" dir="ltr" lang="en">
          ${count}
        </span>
      </button>
    </>
  );
}
