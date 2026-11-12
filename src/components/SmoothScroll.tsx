"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stage } from "@/lib/stage";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export function SmoothScroll() {
  useEffect(() => {
    // every visit (and every refresh) starts at the tape's beginning: no browser or
    // ScrollTrigger scroll memory putting you back where you were
    ScrollTrigger.clearScrollMemory("manual");
    window.scrollTo(0, 0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stage.reduced = true;
      return;
    }

    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  return null;
}

/** Pause / resume page scroll (used by the loader). */
export function lockScroll(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  if (locked) lenis?.stop();
  else lenis?.start();
}

export function scrollToEl(sel: string) {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView();
}
