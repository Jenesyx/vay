"use client";

// The silver foil curtain from the video's wedding hall. Each strand is a
// damped pendulum; the cursor/finger pushes through them, the kick drum
// shakes them. Drawn as hundreds of tiny glints that flicker like foil.

import { useEffect, useRef } from "react";
import { on } from "@/lib/stage";

type Strand = { x: number; len: number; a: number; v: number; seed: number };

export function Tinsel() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const g = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let strands: Strand[] = [];
    let W = 0;
    let H = 0;
    let dpr = 1;
    let visible = true;
    let drawn = false;
    let raf = 0;
    const pointer = { x: -9999, y: -9999, vx: 0 };

    const build = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const gap = W < 768 ? 11 : 12;
      drawn = false;
      strands = [];
      for (let x = gap / 2; x < W; x += gap + Math.random() * 4) {
        // the curtain is pulled open in the middle, like a stage
        const mid = Math.abs(x - W / 2) / (W / 2);
        const len = H * (0.1 + 0.85 * Math.pow(mid, 1.4)) * (0.8 + Math.random() * 0.25);
        strands.push({ x, len, a: 0, v: 0, seed: Math.random() * 100 });
      }
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const nx = e.clientX - r.left;
      pointer.vx = nx - pointer.x;
      pointer.x = nx;
      pointer.y = e.clientY - r.top;
    };
    window.addEventListener("pointermove", move, { passive: true });
    const offBeat = on("beat", () => {
      for (const s of strands) s.v += (Math.random() - 0.5) * 0.05;
    });

    const COLORS = ["rgba(236,238,240,0.95)", "rgba(190,196,204,0.7)", "rgba(140,132,118,0.45)"];
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      // reduced motion: one still frame, redrawn only after a resize
      if (!visible || document.hidden || (reduced && drawn)) return;
      drawn = true;
      const t = reduced ? 0 : now / 1000;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const paths = [new Path2D(), new Path2D(), new Path2D()];

      for (const s of strands) {
        if (!reduced) {
          // push away from the pointer if it's within the strand's reach
          const dx = s.x + Math.sin(s.a) * Math.min(pointer.y, s.len) - pointer.x;
          if (pointer.y < s.len + 20 && Math.abs(dx) < 26) {
            s.v += (Math.sign(dx) || 1) * 0.004 + pointer.vx * 0.0009;
          }
          s.v += -s.a * 0.012 - s.v * 0.04 + Math.sin(t * 0.9 + s.seed) * 0.00025;
          s.a += s.v;
        }
        const segs = Math.floor(s.len / 6);
        for (let k = 1; k < segs; k++) {
          const f = k / segs;
          const y = k * 6;
          // bend grows towards the tip
          const x = s.x + Math.sin(s.a * (0.6 + f)) * y;
          const flick = Math.sin(t * 3 + s.seed * 7 + k * 1.7);
          const bucket = flick > 0.6 ? 0 : flick > -0.2 ? 1 : 2;
          const ang = Math.sin(s.seed + k) * 1.1;
          const p = paths[bucket];
          p.moveTo(x - Math.cos(ang) * 3.2, y - Math.sin(ang) * 3.2);
          p.lineTo(x + Math.cos(ang) * 3.2, y + Math.sin(ang) * 3.2);
        }
      }
      g.lineWidth = 2.2;
      g.lineCap = "round";
      for (let b = 2; b >= 0; b--) {
        g.strokeStyle = COLORS[b];
        g.stroke(paths[b]);
      }
      pointer.vx *= 0.8;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", move);
      offBeat();
    };
  }, []);

  return <canvas ref={ref} className="tinsel" aria-hidden />;
}
