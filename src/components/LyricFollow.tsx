"use client";

// Follow-along. While the song is being sung the page scrolls by itself so the
// current line sits in the clear space above the TV. The moment the visitor
// scrolls on their own, following stops — but a pill stays on screen with the
// line being sung right now (filling as it's sung) and an arrow to where it is
// on the page. Tap it to jump back and follow again.

import { useEffect, useRef, useState } from "react";
import { flatLines } from "@/lib/data";
import { hasTimings, lineAt, on, setFollow, stage } from "@/lib/stage";
import { getLenis } from "./SmoothScroll";

type View = { show: boolean; follow: boolean; text: string; dir: "up" | "down" | "here" };

const lineEl = (i: number) => document.querySelector<HTMLElement>(`.lyric[data-i="${i}"]`);

/** where the current line should sit: centred in the free space above the TV */
function targetY(el: HTMLElement) {
  const mobile = window.innerWidth < 768;
  const tv = mobile ? window.innerWidth * 0.9 : Math.min(window.innerWidth * 0.86, window.innerHeight * 0.74);
  const tvTop = window.innerHeight / 2 - (tv * (mobile ? 0.86 : 0.72)) / 2;
  const r = el.getBoundingClientRect();
  // desktop: stay clear of the verse title stuck in the top-left corner (~80px with its margin)
  const clear = mobile ? 12 : 88;
  const centre = Math.max(r.height / 2 + clear, tvTop / 2);
  return window.scrollY + r.top + r.height / 2 - centre;
}

export function LyricFollow() {
  const [view, setView] = useState<View>({ show: false, follow: true, text: "", dir: "here" });
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!hasTimings) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) stage.follow = false;
    let autoUntil = 0; // ignore scroll events we caused ourselves
    let lastLine = -1; // last line that was sung (kept through short gaps)

    const goTo = (i: number, instant = false) => {
      const el = lineEl(i);
      if (!el) return;
      const y = targetY(el);
      const lenis = getLenis();
      const far = Math.abs(y - window.scrollY) > window.innerHeight * 1.5;
      const duration = instant || reduced ? 0 : far ? 1.6 : 0.85;
      autoUntil = performance.now() + duration * 1000 + 200;
      if (lenis && duration) lenis.scrollTo(y, { duration, easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
      else window.scrollTo(0, y);
    };

    // the visitor takes over: stop following (the pill shows where we are)
    const userScroll = () => {
      if (stage.follow) setFollow(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) userScroll();
    };
    // dragging the scrollbar lands on <html> itself
    const onPointer = (e: PointerEvent) => {
      if (e.target === document.documentElement && performance.now() > autoUntil) userScroll();
    };
    // touch: only a vertical swipe is scrolling (sideways = throwing shabash / turning pages)
    let tx = 0;
    let ty = 0;
    const onTouchStart = (e: TouchEvent) => {
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - tx;
      const dy = e.touches[0].clientY - ty;
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) && !(e.target as Element).closest?.(".book")) userScroll();
    };
    // only real input counts (not resizes, layout shifts or our own scrolling)
    window.addEventListener("wheel", userScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);

    const offLine = on<number>("line", (i) => {
      if (i < 0) return;
      lastLine = i;
      if (stage.follow) goTo(i);
    });
    // following switched back on: jump to the line only if one is being sung right now
    const offFollow = on<boolean>("follow", (f) => {
      const v = stage.video;
      const now = v ? lineAt(v.currentTime) : -1;
      if (f && now >= 0) goTo(now);
    });

    // the pill: what's being sung, where it is, how far through it we are
    let raf = 0;
    let prev = "";
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const v = stage.video;
      const playing = !!v && !v.paused && stage.power && stage.started;
      const i = stage.line >= 0 ? stage.line : lastLine;
      let dir: View["dir"] = "here";
      const el = i >= 0 ? lineEl(i) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        dir = r.bottom < 0 ? "up" : r.top > window.innerHeight ? "down" : "here";
      }
      const next: View = { show: playing && i >= 0, follow: stage.follow, text: i >= 0 ? flatLines[i].text : "", dir };
      const key = JSON.stringify(next);
      if (key !== prev) {
        prev = key;
        setView(next);
      }
      if (fill.current) fill.current.style.transform = `scaleX(${stage.line >= 0 ? stage.lineP : 1})`;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", userScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      offLine();
      offFollow();
    };
  }, []);

  if (!hasTimings) return null;

  const arrow = view.dir === "up" ? "↑" : view.dir === "down" ? "↓" : "●";
  return (
    <div className={`follow ${view.show ? "is-on" : ""} ${view.follow ? "is-following" : "is-away"}`} data-no-shabash aria-hidden={!view.show}>
      {view.follow ? (
        <button className="follow-pill" onClick={() => setFollow(false)} aria-pressed="true" tabIndex={view.show ? 0 : -1}>
          <span className="follow-live" aria-hidden>
            ●
          </span>
          <span dir="rtl">همراه آهنگ</span>
          <span className="en" lang="en">
            following, tap to stop
          </span>
        </button>
      ) : (
        <button
          className="follow-pill"
          onClick={() => {
            setFollow(true);
          }}
          aria-pressed="false"
          aria-label={`Follow the lyrics. Now singing: ${view.text}`}
          tabIndex={view.show ? 0 : -1}
        >
          <span className="follow-arrow" aria-hidden>
            {arrow}
          </span>
          <span className="follow-line" dir="rtl">
            <span className="follow-text">{view.text}</span>
            <span className="follow-fill" aria-hidden>
              <span ref={fill} />
            </span>
          </span>
          <span className="follow-cta" dir="rtl">
            دنبالش کن
          </span>
        </button>
      )}
    </div>
  );
}
