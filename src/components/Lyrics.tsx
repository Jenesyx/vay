"use client";

// The lyric wall that scrolls BEHIND the TV. Kixty's lines swing in from the
// right, Mersad's from the left (6/8 sway), ad-libs bounce on the kick.
// Once lines are synced it becomes karaoke: every line waits at low opacity,
// the line being sung fills word by word to full (gold), sung lines stay lit,
// and clicking any line jumps the tape there. LyricFollow.tsx scrolls along.

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { parts, type Who } from "@/lib/data";
import { hasTimings, lineDone, lineEnd, lineStart, lineWords, on, seek, setFollow, stage } from "@/lib/stage";
import { faNum } from "@/lib/fa";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Line({ text }: { text: string }) {
  // "(ad-libs)" become bubbles; everything else splits into words (Persian splits by word, never by letter)
  const bits = text.split(/(\([^)]*\)?)/g).filter(Boolean);
  return (
    <>
      {/* .w carries the karaoke state, the inner .wi carries the scroll entrance */}
      {bits.map((b, i) =>
        b.startsWith("(") ? (
          <span key={i} className={b.includes("وای") ? "w adlib adlib-vay" : "w adlib"}>
            <span className="wi">{b.replace(/[()]/g, "")}</span>
          </span>
        ) : (
          b
            .split(/(\s+)/)
            .filter(Boolean)
            .map((word, j) =>
              /^\s+$/.test(word) ? (
                word
              ) : (
                <span key={`${i}-${j}`} className="w">
                  <span className="wi">{word}</span>
                </span>
              ),
            )
        ),
      )}
    </>
  );
}

/** index of each part's first line in flatLines / timings.json */
const OFFSETS = parts.map((_, i) => parts.slice(0, i).reduce((a, p) => a + p.lines.length, 0));

const sideOf = (who: Who, i: number) => (who === "kixty" ? 1 : who === "mersad" ? -1 : who === "duo" ? (i % 2 ? -1 : 1) : 0);

/**
 * Each verse arrives its own way:
 * - words: Verse 1, every word flips up out of the line one by one (scroll-scrubbed)
 * - slide: Verse 2, the line slides in from the left and fades up
 * - boom:  Verse 3, the right half slams in from the right, the left half rises from below
 * Everything else swings in from its side.
 */
type Entrance = "words" | "slide" | "boom";
const ENTRANCE: Record<string, Entrance> = { v1: "words", v2: "slide", v3: "boom" };

/** played (not scrubbed) entrances start once the line is ~10% into the screen */
const ENTER_AT = "top 90%";

export function Lyrics() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      const vw = window.innerWidth;
      root.current!.querySelectorAll<HTMLElement>(".lyric").forEach((el) => {
        const side = Number(el.dataset.side);
        const entrance = el.dataset.entrance as Entrance | undefined;

        if (entrance === "slide") {
          // Verse 2: glides in from the left, fading up out of a blur, at its own pace
          gsap.fromTo(
            el,
            { x: -vw * 0.22, opacity: 0, filter: "blur(8px)" },
            {
              x: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 1.15,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: ENTER_AT, toggleActions: "play none none reverse" },
            },
          );
          return;
        }

        if (entrance === "boom") {
          // Verse 3: the line splits in two. The right half (where the Persian line starts)
          // slams in from the right and lands with a punch; then the left half rises from below.
          const wis = Array.from(el.querySelectorAll<HTMLElement>(".wi"));
          const half = Math.ceil(wis.length / 2);
          const right = wis.slice(0, half);
          const left = wis.slice(half);
          const tl = gsap.timeline({ paused: true });
          tl.fromTo(
            right,
            { x: vw * 0.32, opacity: 0, scale: 1.35, filter: "blur(10px)" },
            { x: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.7, ease: "power4.out", stagger: 0.06 },
          ).fromTo(el, { y: 0 }, { y: 7, duration: 0.07, repeat: 3, yoyo: true, ease: "power1.inOut" }, 0.45);
          if (left.length) {
            tl.fromTo(
              left,
              { yPercent: 140, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: 0.85, ease: "power3.out", stagger: 0.08 },
              0.55,
            );
          }
          ScrollTrigger.create({
            trigger: el,
            start: ENTER_AT,
            onEnter: () => tl.play(),
            onLeaveBack: () => tl.reverse(),
          });
          return;
        }

        if (entrance === "words") {
          // Verse 1: each word flips up out of the line, unblurs and lands with a bounce,
          // in reading order (right → left), scrubbed by the scroll
          gsap.fromTo(
            el.querySelectorAll(".wi"),
            { yPercent: 110, rotateX: -85, scale: 0.6, opacity: 0, filter: "blur(10px)", transformPerspective: 500, transformOrigin: "50% 100%" },
            {
              yPercent: 0,
              rotateX: 0,
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
              ease: "back.out(2.2)",
              stagger: { each: 0.16 },
              scrollTrigger: { trigger: el, start: "top 100%", end: "top 62%", scrub: 0.5 },
            },
          );
          return;
        }

        gsap.fromTo(
          el,
          // in karaoke mode the words carry the opacity, the line only swings in;
          // starts ~10% into the screen and takes a longer stretch of scroll so it reads as motion
          { x: side * vw * 0.16, y: side ? 0 : 50, rotate: side * 5, opacity: hasTimings ? 1 : 0.1 },
          {
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: ENTER_AT, end: "top 58%", scrub: 0.8 },
          },
        );
        if (!hasTimings) {
          gsap.to(el, {
            opacity: 0.3,
            scale: 0.94,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: el, start: "top 14%", end: "top -6%", scrub: 0.5 },
          });
        }
      });
      root.current!.querySelectorAll<HTMLElement>(".part-card").forEach((el) => {
        // the card is position: sticky on desktop, so measure from its (static) verse block
        gsap.fromTo(
          el,
          { clipPath: "inset(0 50% 0 50%)", scale: 1.3 },
          {
            clipPath: "inset(0 0% 0 0%)",
            scale: 1,
            ease: "expo.out",
            scrollTrigger: { trigger: el.parentElement, start: "top 90%", end: "top 55%", scrub: 0.6 },
          },
        );
      });
    },
    { scope: root },
  );

  // karaoke: dim → filled word by word → lit
  useEffect(() => {
    if (!hasTimings) return;
    const sec = root.current!;
    sec.classList.add("is-karaoke");
    const lines = Array.from(sec.querySelectorAll<HTMLElement>(".lyric"));
    // each word's share of the line, by length, as [from, to] fractions
    const spans = lines.map((l) => {
      const ws = Array.from(l.querySelectorAll<HTMLElement>(".w"));
      const lens = ws.map((w) => Math.max(2, (w.textContent ?? "").length));
      const total = lens.reduce((a, b) => a + b, 0);
      let acc = 0;
      return ws.map((w, k) => {
        const from = acc / total;
        acc += lens[k];
        return { w, from, to: acc / total };
      });
    });

    let cur = -1;
    const markSung = () => {
      const t = stage.video?.currentTime ?? 0;
      lines.forEach((l, i) => l.classList.toggle("is-sung", i !== cur && lineDone(i, t)));
    };
    const clearFill = (i: number) => spans[i]?.forEach(({ w }) => w.style.removeProperty("--f"));

    const offLine = on<number>("line", (i) => {
      if (cur >= 0) {
        lines[cur]?.classList.remove("is-now");
        clearFill(cur);
      }
      cur = i;
      if (i >= 0) lines[i]?.classList.add("is-now");
      markSung();
    });
    const v = stage.video;
    v?.addEventListener("seeked", markSung);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (cur < 0 || !spans[cur]) return;
      const ws = lineWords(cur);
      const sp = spans[cur];
      if (ws && ws.length === sp.length) {
        // real word timing from the alignment: each word lights as it's sung
        const t = stage.video?.currentTime ?? 0;
        const end = lineEnd(cur) ?? t;
        let last = lineStart(cur) ?? 0;
        sp.forEach((s, k) => {
          const st = ws[k] ?? last;
          last = st;
          const next = ws.slice(k + 1).find((x) => typeof x === "number") ?? end;
          const d = Math.max(0.12, Math.min(0.45, next - st));
          s.w.style.setProperty("--f", Math.min(1, Math.max(0, (t - st) / d)).toFixed(2));
        });
        return;
      }
      // no word timing: spread the line's duration over its words by length
      const p = stage.lineP;
      for (const s of sp) {
        const f = Math.min(1, Math.max(0, (p - s.from) / (s.to - s.from || 1)));
        s.w.style.setProperty("--f", f.toFixed(2));
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      offLine();
      v?.removeEventListener("seeked", markSung);
    };
  }, []);

  const jump = (t: number) => {
    seek(t);
    setFollow(true);
  };

  return (
    <section id="lyrics" ref={root} className="lyrics" aria-label="Lyrics / متن آهنگ">
      {parts.map((p, pi) => (
        <div key={p.id} className={`part part-${p.who}`}>
          <header className="part-card">
            <span className="spark" aria-hidden>✦</span>
            <h2 dir="rtl">{p.fa}</h2>
            <p dir="ltr" lang="en">{p.en}</p>
            <span className="spark" aria-hidden>✦</span>
          </header>
          {p.lines.map((text, li) => {
            const idx = OFFSETS[pi] + li;
            const start = lineStart(idx);
            const clickable = hasTimings && start !== null;
            return (
              <p
                key={idx}
                data-i={idx}
                data-side={sideOf(p.who, li)}
                data-entrance={ENTRANCE[p.id]}
                className={`lyric side-${sideOf(p.who, li)}`}
                dir="rtl"
                {...(clickable
                  ? {
                      role: "button",
                      tabIndex: 0,
                      "aria-label": `${text} — ${faNum(Math.floor(start!))}`,
                      onClick: () => jump(start!),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          jump(start!);
                        }
                      },
                    }
                  : {})}
              >
                <Line text={text} />
              </p>
            );
          })}
        </div>
      ))}
    </section>
  );
}
