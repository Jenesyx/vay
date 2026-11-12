"use client";

// The wedding album (آلبوم عروسی). A real Persian book: the spine is on the
// right and pages turn left → right. Drag a page (or use the arrows) to turn
// it; the plastic sleeve glare slides as the page bends. Every photo is a
// frame from the video — tap its time and the TV in the corner jumps there.

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { album, song } from "@/lib/data";
import { faNum, faTime } from "@/lib/fa";
import { seek } from "@/lib/stage";

type Face = { kind: "cover" } | { kind: "back" } | { kind: "photo"; n: number };

// faces in reading order: cover, p1..p12, back cover → 7 leaves
const faces: Face[] = [{ kind: "cover" }, ...album.map((_, n) => ({ kind: "photo" as const, n })), { kind: "back" }];
const LEAVES = Math.ceil(faces.length / 2);

function FaceView({ face }: { face: Face }) {
  if (face.kind === "cover")
    return (
      <div className="page cover">
        <span className="cover-ornament" aria-hidden>✦ ✧ ✦</span>
        <p className="cover-title">{song.fa}</p>
        <p className="cover-sub">آلبوم عروسی</p>
        <p className="cover-en">{song.artists.en}</p>
      </div>
    );
  if (face.kind === "back")
    return (
      <div className="page cover cover-back">
        <span className="cover-ornament" aria-hidden>✦ ✧ ✦</span>
        <p className="cover-sub">یادش بخیر</p>
        <p className="cover-en">the good old days</p>
      </div>
    );
  const a = album[face.n];
  return (
    <div className="page paper">
      <span className="glitter g1" aria-hidden>✦</span>
      <span className="glitter g2" aria-hidden>✦</span>
      <span className="glitter g3" aria-hidden>✧</span>
      <figure className={`photo frame-${a.frame}`}>
        <span className="photo-gold" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.src} alt={a.alt} loading="lazy" draggable={false} />
      </figure>
      <button className="photo-time" onClick={() => seek(a.t)} aria-label={`Play the video from ${Math.floor(a.t)} seconds`}>
        ▶ {faTime(a.t)}
      </button>
      <span className="page-no">{faNum(face.n + 1)}</span>
    </div>
  );
}

export function Album() {
  const bookRef = useRef<HTMLDivElement>(null);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);
  const state = useRef({ p: 0 });
  const [page, setPage] = useState(0);

  const render = (p: number) => {
    const book = bookRef.current;
    if (!book) return;
    // phones: a top-bound album, pages flip upwards; desktop: RTL book, pages flip to the right
    const vertical = window.matchMedia("(max-width: 767px)").matches;
    const open = Math.round(p); // the spread showing: back of leaf open-1 + front of leaf open
    leafRefs.current.forEach((leaf, i) => {
      if (!leaf) return;
      const k = Math.min(1, Math.max(0, p - i));
      leaf.style.transform = vertical ? `rotateX(${-k * 180}deg)` : `rotateY(${k * 180}deg)`;
      leaf.style.zIndex = String(k > 0.5 ? i + 1 : LEAVES - i + 1);
      leaf.style.setProperty("--turn", k.toFixed(3));
      // hidden pages leave the tab order
      (leaf.children[0] as HTMLElement).inert = i !== open;
      (leaf.children[1] as HTMLElement).inert = i !== open - 1;
    });
    // a closed book sits centred on its cover; an open one centres the spread
    const closed = 1 - Math.min(1, p, LEAVES - p);
    const shift = (p < LEAVES / 2 ? 1 : -1) * closed * 25;
    book.style.setProperty("--sx", vertical ? "0%" : `${shift}%`);
    book.style.setProperty("--sy", vertical ? `${-shift}%` : "0%");
  };

  const go = (target: number) => {
    const p = Math.max(0, Math.min(LEAVES, target));
    gsap.to(state.current, {
      p,
      duration: 0.9,
      ease: "power3.out",
      onUpdate: () => render(state.current.p),
    });
    setPage(p);
  };

  useEffect(() => {
    render(0);
    const book = bookRef.current!;
    let start = 0;
    let startP = 0;
    let dragging = false;
    let last = 0;
    let vel = 0;
    let vertical = false;
    // desktop: RTL book, drag right = forward; phones: top-bound album, swipe up = forward
    const pos = (e: PointerEvent) => (vertical ? -e.clientY : e.clientX);
    const pageLen = () => {
      const r = book.getBoundingClientRect();
      return vertical ? r.height / 2 : r.width / 2;
    };

    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest("button")) return;
      vertical = window.matchMedia("(max-width: 767px)").matches;
      dragging = true;
      start = last = pos(e);
      startP = state.current.p;
      vel = 0;
      gsap.killTweensOf(state.current);
      book.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const x = pos(e);
      vel = x - last;
      last = x;
      state.current.p = Math.max(0, Math.min(LEAVES, startP + (x - start) / (pageLen() * 1.1)));
      render(state.current.p);
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      const p = state.current.p;
      go(Math.round(p + Math.max(-0.45, Math.min(0.45, vel * 0.04))));
    };
    book.addEventListener("pointerdown", down);
    book.addEventListener("pointermove", move);
    book.addEventListener("pointerup", up);
    book.addEventListener("pointercancel", up);
    return () => {
      book.removeEventListener("pointerdown", down);
      book.removeEventListener("pointermove", move);
      book.removeEventListener("pointerup", up);
      book.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      go(Math.round(state.current.p) + 1);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      go(Math.round(state.current.p) - 1);
    }
  };

  return (
    <section id="album" className="album" aria-label="Wedding album / آلبوم عروسی">
      <header className="album-head">
        <h2 dir="rtl">آلبوم عروسی</h2>
        <p dir="ltr" lang="en">the wedding album: turn the pages</p>
      </header>

      <div className="book-stage" data-no-shabash data-lenis-prevent-touch>
        <div ref={bookRef} className="book" tabIndex={0} onKeyDown={onKey} aria-label="Album, use arrow keys to turn pages" dir="ltr">
          {Array.from({ length: LEAVES }, (_, i) => (
            <div key={i} className="leaf" ref={(el) => void (leafRefs.current[i] = el)}>
              <div className="leaf-face front">{faces[i * 2] && <FaceView face={faces[i * 2]} />}</div>
              <div className="leaf-face back">{faces[i * 2 + 1] && <FaceView face={faces[i * 2 + 1]} />}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="book-nav">
        <button onClick={() => go(Math.round(state.current.p) + 1)} disabled={page >= LEAVES} aria-label="Next page">
          ورق بزن
        </button>
        <span className="book-count" aria-live="polite">
          {faNum(Math.min(page * 2, faces.length - 1))} / {faNum(faces.length - 1)}
        </span>
        <button onClick={() => go(Math.round(state.current.p) - 1)} disabled={page <= 0} aria-label="Previous page">
          برگرد
        </button>
      </div>
    </section>
  );
}
