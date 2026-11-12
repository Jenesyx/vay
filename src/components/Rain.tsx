"use client";

// SHABASH RAIN: WebGL2 instanced paper bills that really flutter.
// Each bill is a bent 12×4 mesh (curl + travelling flutter wave), rotated in 3D
// and lit by its normal, so it flashes as it flips. Two layers: one behind the
// TV (small, far, slow) and one in front (big, close). Scroll is wind, the
// kick drum drops a few, and a flick anywhere throws money off your hand.

import { useEffect, useRef } from "react";
import { BILL_H, drawBillAtlas } from "./bill-texture";
import { addShabash, on, stage } from "@/lib/stage";

const VERT = /* glsl */ `#version 300 es
in vec2 a_uv;
in vec3 i_pos;   // x px, y px, size px
in vec3 i_rot;   // euler
in vec2 i_bend;  // curl, flutter phase
uniform vec2 u_res;
out vec2 v_uv;
out float v_shade;
mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
void main(){
  float u = a_uv.x - 0.5;
  vec3 p = vec3(u, (a_uv.y - 0.5) * 0.4258, 0.0);
  float w = 6.2832;
  p.z = i_bend.x * (u*u - 0.083) + 0.03 * sin(a_uv.x * w + i_bend.y);
  float dz = i_bend.x * 2.0 * u + 0.03 * w * cos(a_uv.x * w + i_bend.y);
  vec3 n = normalize(vec3(-dz, 0.0, 1.0));
  mat3 R = rz(i_rot.z) * ry(i_rot.y) * rx(i_rot.x);
  p = R * p * i_pos.z;
  n = R * n;
  float persp = 900.0 / (900.0 - p.z);
  vec2 sp = i_pos.xy + p.xy * persp;
  gl_Position = vec4(sp.x / u_res.x * 2.0 - 1.0, 1.0 - sp.y / u_res.y * 2.0, 0.0, 1.0);
  v_uv = a_uv;
  v_shade = 0.62 + 0.38 * abs(n.z) + 0.22 * n.x - 0.12 * n.y;
}`;

const FRAG = /* glsl */ `#version 300 es
precision mediump float;
uniform sampler2D u_tex;
uniform float u_dim;
in vec2 v_uv;
in float v_shade;
out vec4 o;
void main(){
  float fh = ${(BILL_H / (BILL_H * 2 + 4)).toFixed(5)};
  float b0 = ${((BILL_H + 4) / (BILL_H * 2 + 4)).toFixed(5)};
  vec2 uv = gl_FrontFacing ? vec2(v_uv.x, v_uv.y * fh) : vec2(1.0 - v_uv.x, b0 + v_uv.y * fh);
  vec4 c = texture(u_tex, uv);
  if (c.a < 0.05) discard;
  o = vec4(c.rgb * v_shade * u_dim, c.a);
}`;

const SEG_X = 12;
const SEG_Y = 4;
const MAX = 170;

type Layer = {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  inst: Float32Array; // 8 floats per bill
  instBuf: WebGLBuffer;
  vao: WebGLVertexArrayObject;
  prog: WebGLProgram;
  tex: WebGLTexture;
  idxCount: number;
  uRes: WebGLUniformLocation | null;
  uDim: WebGLUniformLocation | null;
  // sim
  alive: Uint8Array;
  ambient: Uint8Array;
  x: Float32Array; y: Float32Array; vx: Float32Array; vy: Float32Array;
  ax: Float32Array; ay: Float32Array; az: Float32Array;
  wx: Float32Array; wy: Float32Array;
  size: Float32Array; seed: Float32Array; term: Float32Array;
  sizeRange: [number, number];
  ambientCount: number;
  wind: number;
  dim: number;
  cleanup: () => void;
};

function makeLayer(canvas: HTMLCanvasElement, atlas: HTMLCanvasElement, opts: { size: [number, number]; ambient: number; wind: number; dim: number }): Layer | null {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: false, antialias: true });
  if (!gl) return null;
  const sh = (t: number, s: string) => {
    const x = gl.createShader(t)!;
    gl.shaderSource(x, s);
    gl.compileShader(x);
    return x;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;

  // grid mesh
  const uvs: number[] = [];
  for (let j = 0; j <= SEG_Y; j++) for (let i = 0; i <= SEG_X; i++) uvs.push(i / SEG_X, j / SEG_Y);
  const idx: number[] = [];
  for (let j = 0; j < SEG_Y; j++)
    for (let i = 0; i < SEG_X; i++) {
      const a = j * (SEG_X + 1) + i;
      const b = a + 1;
      const c = a + SEG_X + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  const aUv = gl.getAttribLocation(prog, "a_uv");
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

  const inst = new Float32Array(MAX * 8);
  const instBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
  gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW);
  const attr = (name: string, size: number, offset: number) => {
    const l = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(l);
    gl.vertexAttribPointer(l, size, gl.FLOAT, false, 32, offset * 4);
    gl.vertexAttribDivisor(l, 1);
  };
  attr("i_pos", 3, 0);
  attr("i_rot", 3, 3);
  attr("i_bend", 2, 6);
  gl.bindVertexArray(null);

  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const f = () => new Float32Array(MAX);
  return {
    gl, canvas, inst, instBuf, vao, prog, tex,
    idxCount: idx.length,
    uRes: gl.getUniformLocation(prog, "u_res"),
    uDim: gl.getUniformLocation(prog, "u_dim"),
    alive: new Uint8Array(MAX), ambient: new Uint8Array(MAX),
    x: f(), y: f(), vx: f(), vy: f(), ax: f(), ay: f(), az: f(), wx: f(), wy: f(),
    size: f(), seed: f(), term: f(),
    sizeRange: opts.size, ambientCount: opts.ambient, wind: opts.wind, dim: opts.dim,
    cleanup: () => {
      gl.deleteBuffer(uvBuf);
      gl.deleteBuffer(ib);
      gl.deleteBuffer(instBuf);
      gl.deleteVertexArray(vao);
      gl.deleteTexture(tex);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** fvx/fvy: the flick's velocity (px/s); 0 = a plain toss upwards */
function spawn(L: Layer, x: number, y: number, thrown: boolean, fvx = 0, fvy = 0) {
  let i = -1;
  for (let k = 0; k < MAX; k++)
    if (!L.alive[k]) {
      i = k;
      break;
    }
  if (i < 0) return false;
  L.alive[i] = 1;
  L.ambient[i] = thrown ? 0 : 1;
  L.x[i] = x;
  L.y[i] = y;
  L.size[i] = rand(L.sizeRange[0], L.sizeRange[1]);
  L.seed[i] = rand(0, 100);
  L.term[i] = rand(55, 120) * (L.size[i] / L.sizeRange[1] + 0.4);
  L.ax[i] = rand(0, 6.28);
  L.ay[i] = rand(0, 6.28);
  L.az[i] = rand(-0.6, 0.6);
  if (thrown && (fvx || fvy)) {
    // follow the flick, fan out a little, keep some lift so bills float
    const k = rand(0.7, 1.2);
    let vx = fvx * k + rand(-140, 140);
    let vy = fvy * k + rand(-260, -60);
    const sp = Math.hypot(vx, vy);
    if (sp > 2200) {
      vx *= 2200 / sp;
      vy *= 2200 / sp;
    }
    L.vx[i] = vx;
    L.vy[i] = vy;
    L.wx[i] = rand(6, 14) * (Math.random() < 0.5 ? -1 : 1);
    L.wy[i] = rand(3, 9) * (Math.random() < 0.5 ? -1 : 1);
  } else if (thrown) {
    const a = rand(-Math.PI * 0.85, -Math.PI * 0.15);
    const sp = rand(380, 980);
    L.vx[i] = Math.cos(a) * sp;
    L.vy[i] = Math.sin(a) * sp;
    L.wx[i] = rand(5, 12) * (Math.random() < 0.5 ? -1 : 1);
    L.wy[i] = rand(3, 9) * (Math.random() < 0.5 ? -1 : 1);
  } else {
    L.vx[i] = 0;
    L.vy[i] = L.term[i];
    L.wx[i] = rand(1.2, 3.2) * (Math.random() < 0.5 ? -1 : 1);
    L.wy[i] = rand(0.6, 2.2) * (Math.random() < 0.5 ? -1 : 1);
  }
  return true;
}

export function Rain() {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let raf = 0;
    const layers: Layer[] = [];
    const offs: (() => void)[] = [];
    let front: Layer | null = null;
    let back: Layer | null = null;

    // --- throwing: always counted (also without WebGL / with reduced motion), drawn when we can
    const throwAt = (x: number, y: number, n: number, fvx = 0, fvy = 0) => {
      let made = 0;
      for (let j = 0; j < n; j++) {
        const L = Math.random() < 0.6 ? front : back;
        if (!L || spawn(L, x + rand(-14, 14), y + rand(-10, 10), true, fvx, fvy)) made++;
      }
      if (made) addShabash(made);
    };
    // extra bills from the ceiling; flagged ambient, so they respawn only while
    // the layer is below its normal drizzle count and otherwise fall away
    const rainFromTop = (n: number) => {
      if (!front || !back) return;
      for (let j = 0; j < n; j++) spawn(Math.random() < 0.5 ? front : back, rand(0, innerWidth), rand(-260, -40), false);
    };
    const blocked = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("a,button,input,textarea,label,select,[role=button],[data-no-shabash]");

    // FLICK to throw, the way shabash is really thrown: tap = a toss straight up;
    // drag fast = bills peel off your hand in the direction and speed of the flick.
    // On touch only sideways flicks count (vertical swipes stay page scroll).
    const g = { armed: false, touch: false, x: 0, y: 0, sx: 0, sy: 0, t0: 0, lt: 0, vx: 0, vy: 0, peel: 0 };
    const down = (e: PointerEvent) => {
      if (!stage.started || blocked(e.target) || e.button > 0) return;
      Object.assign(g, { armed: true, touch: e.pointerType === "touch", x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t0: e.timeStamp, lt: e.timeStamp, vx: 0, vy: 0, peel: 0 });
    };
    const move = (e: PointerEvent) => {
      if (!g.armed) return;
      const dt = Math.max(1, e.timeStamp - g.lt) / 1000;
      const ivx = (e.clientX - g.x) / dt;
      const ivy = (e.clientY - g.y) / dt;
      g.vx = g.vx * 0.5 + ivx * 0.5;
      g.vy = g.vy * 0.5 + ivy * 0.5;
      g.peel += Math.hypot(e.clientX - g.x, e.clientY - g.y);
      g.x = e.clientX;
      g.y = e.clientY;
      g.lt = e.timeStamp;
      const speed = Math.hypot(g.vx, g.vy);
      const sideways = Math.abs(g.vx) > Math.abs(g.vy) * 1.2;
      if (g.peel > 26 && speed > 450 && (!g.touch || sideways)) {
        g.peel = 0;
        throwAt(g.x, g.y, speed > 1400 ? 2 : 1, g.vx * 0.55, g.vy * 0.55);
      }
    };
    const up = (e: PointerEvent) => {
      if (!g.armed) return;
      g.armed = false;
      const moved = Math.hypot(g.x - g.sx, g.y - g.sy);
      const speed = Math.hypot(g.vx, g.vy);
      const fresh = e.timeStamp - g.lt < 90; // still moving when released
      if (moved < 10 && e.timeStamp - g.t0 < 400) throwAt(g.x, g.y, 5);
      else if (fresh && speed > 600 && (!g.touch || Math.abs(g.vx) > Math.abs(g.vy) * 1.2)) throwAt(g.x, g.y, 6, g.vx * 0.8, g.vy * 0.8);
    };
    const cancel = () => (g.armed = false);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    offs.push(() => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    });
    offs.push(on("beat", () => rainFromTop(2)));
    offs.push(on<number>("burst", (n) => rainFromTop(n ?? 40)));
    offs.push(on<{ x: number; y: number; n: number }>("throw", (d) => throwAt(d.x, d.y, d.n)));

    const boot = async () => {
      await document.fonts.ready;
      if (disposed) return;
      const cs = getComputedStyle(document.body);
      const fa = cs.getPropertyValue("--font-lalezar").trim() || "serif";
      const la = cs.getPropertyValue("--font-markazi").trim() || "serif";
      const atlas = drawBillAtlas(fa, la);
      const mobile = window.innerWidth < 768;
      const k = mobile ? 0.62 : 1;
      const b = makeLayer(backRef.current!, atlas, { size: [34 * k, 64 * k], ambient: mobile ? 9 : 16, wind: 0.22, dim: 0.62 });
      const f = makeLayer(frontRef.current!, atlas, { size: [92 * k, 150 * k], ambient: mobile ? 4 : 7, wind: 0.45, dim: 1 });
      if (!b || !f) return;
      back = b;
      front = f;
      layers.push(b, f);

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        for (const L of layers) {
          L.canvas.width = Math.round(window.innerWidth * dpr);
          L.canvas.height = Math.round(window.innerHeight * dpr);
          L.gl.viewport(0, 0, L.canvas.width, L.canvas.height);
        }
      };
      resize();
      window.addEventListener("resize", resize);
      offs.push(() => window.removeEventListener("resize", resize));

      // ambient bills start spread over the screen
      for (const L of layers) for (let n = 0; n < L.ambientCount; n++) spawn(L, rand(0, innerWidth), rand(-innerHeight, innerHeight), false);

      // --- sim + draw
      let last = performance.now();
      let lastScroll = window.scrollY;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (document.hidden) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const t = now / 1000;
        const dy = window.scrollY - lastScroll;
        lastScroll = window.scrollY;
        const W = innerWidth;
        const H = innerHeight;

        for (const L of layers) {
          let live = 0;
          let ambientLive = 0;
          const windY = -dy * L.wind;
          for (let i = 0; i < MAX; i++) {
            if (!L.alive[i]) continue;
            const s = L.seed[i];
            // gravity, then air: velocity relaxes to a slow flutter fall
            L.vy[i] += 900 * dt;
            if (L.vy[i] > L.term[i]) L.vy[i] += (L.term[i] - L.vy[i]) * Math.min(1, dt * 4);
            L.vx[i] += Math.sin(t * 1.3 + s) * 60 * dt;
            L.vx[i] *= 1 - Math.min(1, dt * 1.6);
            L.x[i] += L.vx[i] * dt;
            L.y[i] += L.vy[i] * dt + windY;
            // tumbling slows down to a gentle flip
            const spin = L.ambient[i] ? 1 : Math.max(0.35, 1 - dt * 0.8);
            L.wx[i] *= spin;
            L.wy[i] *= spin;
            L.ax[i] += L.wx[i] * dt;
            L.ay[i] += L.wy[i] * dt;
            const rz = L.az[i] + Math.sin(t * 1.3 + s) * 0.35;
            const sz = L.size[i];

            if (L.y[i] > H + sz * 1.5 || L.x[i] < -sz * 3 || L.x[i] > W + sz * 3 || L.y[i] < -H * 1.6) {
              if (L.ambient[i] && ambientLive < L.ambientCount) {
                L.x[i] = rand(0, W);
                L.y[i] = dy < 0 && L.y[i] < 0 ? H + sz : -sz - rand(0, H * 0.3);
                L.vy[i] = L.term[i];
                L.vx[i] = 0;
              } else {
                L.alive[i] = 0;
                continue;
              }
            }
            if (L.ambient[i]) ambientLive++;
            const o = live * 8;
            L.inst[o] = L.x[i];
            L.inst[o + 1] = L.y[i];
            L.inst[o + 2] = sz;
            L.inst[o + 3] = L.ax[i];
            L.inst[o + 4] = L.ay[i];
            L.inst[o + 5] = rz;
            L.inst[o + 6] = 0.22 * Math.sin(t * 1.7 + s);
            L.inst[o + 7] = t * 5 + s;
            live++;
          }
          // keep the ambient drizzle topped up (extra burst bills fall away)
          for (let need = L.ambientCount - ambientLive; need > 0; need--) spawn(L, rand(0, W), -60 - rand(0, H * 0.4), false);

          const { gl } = L;
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          if (!live) continue;
          gl.useProgram(L.prog);
          gl.uniform2f(L.uRes, W, H);
          gl.uniform1f(L.uDim, L.dim);
          gl.bindTexture(gl.TEXTURE_2D, L.tex);
          gl.bindVertexArray(L.vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, L.instBuf);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, L.inst, 0, live * 8);
          gl.drawElementsInstanced(gl.TRIANGLES, L.idxCount, gl.UNSIGNED_SHORT, 0, live);
          gl.bindVertexArray(null);
        }
      };
      raf = requestAnimationFrame(frame);
    };
    // reduced motion: no drawing, but throws (and the counter) still work
    if (!reduced) boot();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      offs.forEach((f) => f());
      layers.forEach((L) => L.cleanup());
    };
  }, []);

  return (
    <>
      <canvas ref={backRef} className="rain rain-back" aria-hidden />
      <canvas ref={frontRef} className="rain rain-front" aria-hidden />
    </>
  );
}
