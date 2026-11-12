"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import geo from "@/lib/tv-geometry.json";
import { song, flatLines } from "@/lib/data";
import { stage, on, setMuted, setPower, nextChannel, resumeAudio, startAudio } from "@/lib/stage";
import { CRT_FRAG, CRT_VERT } from "./crt-shader";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const S = geo.screen;
const pct = (n: number) => `${(n * 100).toFixed(3)}%`;
// knob + button centres measured on the 1254px TV image
const KNOB = { x: 1060 / 1254, y: 602 / 1254, d: 148 / 1254 };
const VOL = { x: 1014 / 1254, y: 755 / 1254, d: 78 / 1254 };
const PWR = { x: 1129 / 1254, y: 755 / 1254, d: 62 / 1254 };

const CHANNEL_LABEL = ["CH 01", "CH 02  B/W", "CH 03"];

export function Tv() {
  const rig = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const [osd, setOsd] = useState<{ ch: string | null; vol: boolean | null }>({ ch: null, vol: null });
  const [playing, setPlaying] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [noGl, setNoGl] = useState(false);
  const fx = useRef({ power: 1, stat: 0, visible: true, dirty: true });

  // ---------------------------------------------------------------- video + bus
  useEffect(() => {
    const v = videoRef.current!;
    stage.video = v;
    // pick the file on the client so phones never get the bigger one; with
    // preload="none" nothing downloads until the loader's PLAY tap
    if (!v.getAttribute("src")) {
      v.src = window.matchMedia("(max-width: 767px)").matches ? song.videoSm : song.video;
    }
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onSeeked = () => (fx.current.dirty = true);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("loadeddata", onSeeked);

    let osdTimer = 0;
    const flash = (next: Partial<typeof osd>) => {
      setOsd((o) => ({ ...o, ...next }));
      window.clearTimeout(osdTimer);
      osdTimer = window.setTimeout(() => setOsd({ ch: null, vol: null }), 2200);
    };

    const offCh = on<number>("channel", (ch) => {
      fx.current.stat = 1;
      flash({ ch: CHANNEL_LABEL[ch] });
      setAnnounce(["Channel 1, colour", "Channel 2, black and white", "Channel 3, static"][ch]);
    });
    const offTv = on<{ power?: boolean; muted?: boolean }>("tv", (d) => {
      if (typeof d.power === "boolean") {
        gsap.to(fx.current, { power: d.power ? 1 : 0, duration: d.power ? 0.45 : 0.6, ease: d.power ? "power2.out" : "power3.in" });
        setAnnounce(d.power ? "TV on" : "TV off");
      }
      if (typeof d.muted === "boolean") {
        flash({ vol: !d.muted });
        setMutedState(d.muted);
      }
    });
    const offLine = on<number>("line", (i) => {
      const el = subRef.current;
      if (!el) return;
      const text = i >= 0 ? flatLines[i].text : "";
      el.textContent = text;
      el.style.opacity = text ? "1" : "0";
    });
    const offBeat = on("beat", () => {
      if (stage.reduced || !rig.current) return;
      gsap.fromTo(rig.current.querySelector(".tv-body"), { scale: 1.028, rotate: gsap.utils.random(-0.8, 0.8) }, { scale: 1, rotate: 0, duration: 0.32, ease: "power2.out", overwrite: true });
    });

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("loadeddata", onSeeked);
      offCh();
      offTv();
      offLine();
      offBeat();
      window.clearTimeout(osdTimer);
    };
  }, []);

  // ---------------------------------------------------------------- CRT WebGL
  useEffect(() => {
    const canvas = canvasRef.current!;
    const video = videoRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) {
      const t = window.setTimeout(() => setNoGl(true), 0);
      return () => window.clearTimeout(t);
    }

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, CRT_VERT);
    const fs = sh(gl.FRAGMENT_SHADER, CRT_FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const t = window.setTimeout(() => setNoGl(true), 0);
      return () => window.clearTimeout(t);
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = {
      res: u("u_res"), time: u("u_time"), cover: u("u_cover"), has: u("u_hasVideo"),
      mode: u("u_mode"), stat: u("u_static"), power: u("u_power"), beat: u("u_beat"),
    };

    const dprCap = window.matchMedia("(max-width: 768px)").matches ? 1.5 : 2;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.max(2, Math.round(r.width * dpr));
      canvas.height = Math.max(2, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let hasFrame = false;
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const f = fx.current;
      // upload only new frames: playing, or after a seek / first load
      if (video.readyState >= 2 && f.power > 0.001 && (!video.paused || f.dirty)) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        hasFrame = true;
        f.dirty = false;
      }
      f.stat *= 0.9;
      const screenAspect = canvas.width / canvas.height;
      const vidAspect = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 4 / 3;
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, stage.reduced ? 0 : (now - t0) / 1000);
      gl.uniform1f(U.cover, screenAspect / vidAspect);
      gl.uniform1f(U.has, hasFrame ? 1 : 0);
      gl.uniform1f(U.mode, stage.channel);
      gl.uniform1f(U.stat, f.stat);
      gl.uniform1f(U.power, f.power);
      gl.uniform1f(U.beat, stage.reduced ? 0 : stage.beat);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  // ---------------------------------------------------------------- scroll choreography
  useGSAP(() => {
    const el = rig.current!;
    const mm = gsap.matchMedia();
    mm.add({ mobile: "(max-width: 767px)", desktop: "(min-width: 768px)" }, (c) => {
      const mobile = c.conditions?.mobile;
      // reset fully: switching phone ↔ desktop must not inherit the other layout's corner offset
      gsap.set(el, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1 });
      const size = () => el.offsetWidth;
      const lyricScale = mobile ? 0.86 : 0.72;
      const miniScale = mobile ? 0.36 : 0.26;

      gsap.fromTo(
        el,
        { scale: 1, x: 0, y: () => window.innerHeight * (mobile ? 0.02 : 0.06) },
        {
          scale: lyricScale,
          x: 0,
          y: 0,
          ease: "none",
          scrollTrigger: { trigger: "#lyrics", start: "top bottom", end: "top 35%", scrub: 0.6, invalidateOnRefresh: true },
        },
      );
      gsap.fromTo(
        el,
        { scale: lyricScale, x: 0, y: 0 },
        {
          scale: miniScale,
          x: () => -(window.innerWidth / 2 - (size() * miniScale) / 2 - 10),
          // phones: park it top-left so it never covers the album/invite buttons
          y: () => (mobile ? -1 : 1) * (window.innerHeight / 2 - (size() * miniScale) / 2 - (mobile ? 2 : 4)),
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: "#album", start: "top bottom", end: "top 25%", scrub: 0.6, invalidateOnRefresh: true },
        },
      );
      ScrollTrigger.create({
        trigger: "#end",
        start: "top 55%",
        onEnter: () => stage.started && setPower(false),
        onLeaveBack: () => stage.started && setPower(true),
      });
    });
    return () => mm.revert();
  });

  // ---------------------------------------------------------------- knob: drag to turn, click for next
  useEffect(() => {
    const knob = knobRef.current!;
    let angle = 0;
    let dragging = false;
    let start = 0;
    let acc = 0;
    let moved = false;
    const centre = () => {
      const r = knob.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const ang = (e: PointerEvent) => {
      const c = centre();
      return (Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180) / Math.PI;
    };
    const step = () => {
      nextChannel();
      resumeAudio();
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      moved = false;
      start = ang(e);
      acc = 0;
      knob.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      let a = ang(e);
      let d = a - start;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      start = a;
      angle += d;
      acc += d;
      if (Math.abs(acc) > 4) moved = true;
      if (Math.abs(acc) >= 36) {
        acc = 0;
        step();
      }
      gsap.set(knob, { rotate: angle });
      a = 0;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      if (!moved) {
        angle += 36;
        gsap.to(knob, { rotate: angle, duration: 0.25, ease: "back.out(3)" });
        step();
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        angle += 36;
        gsap.to(knob, { rotate: angle, duration: 0.25, ease: "back.out(3)" });
        step();
      }
    };
    knob.addEventListener("pointerdown", down);
    knob.addEventListener("pointermove", move);
    knob.addEventListener("pointerup", up);
    knob.addEventListener("pointercancel", up);
    knob.addEventListener("keydown", key);
    return () => {
      knob.removeEventListener("pointerdown", down);
      knob.removeEventListener("pointermove", move);
      knob.removeEventListener("pointerup", up);
      knob.removeEventListener("pointercancel", up);
      knob.removeEventListener("keydown", key);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !stage.started) return;
    if (!stage.power) return setPower(true);
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    resumeAudio();
  };

  return (
    <div ref={rig} className="tv-rig" data-no-shabash>
      <div className="tv-body">
        {/* screen: video → CRT canvas → OSD, all behind the TV's cut-out glass */}
        <div className="tv-screen" style={{ left: pct(S.left), top: pct(S.top), width: pct(S.width), height: pct(S.height) }}>
          <video
            ref={videoRef}
            className={noGl ? "tv-video is-visible" : "tv-video"}
            poster={song.poster}
            preload="none"
            playsInline
            loop
            aria-label="KIXTY × MERSAD — VAY, official music video"
          />
          <canvas ref={canvasRef} className={noGl ? "hidden" : "tv-canvas"} aria-hidden />
          <div className="tv-osd" aria-hidden>
            <span className="osd-tl">{osd.ch}</span>
            <span className="osd-bl">{playing ? "▶ PLAY" : "❚❚ PAUSE"}</span>
            <span className="osd-br">1374/06/08</span>
            {osd.vol !== null && (
              <span className="osd-vol">
                VOLUME {osd.vol ? "▮▮▮▮▮▮▮▮" : "▯▯▯▯▯▯▯▯  MUTE"}
              </span>
            )}
            <p ref={subRef} className="osd-sub" dir="rtl" />
          </div>
          <button className="tv-hit" onClick={togglePlay} aria-label={playing ? "Pause the video" : "Play the video"} />
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/tv.webp" alt="" className="tv-img" draggable={false} />

        <div
          ref={knobRef}
          role="button"
          tabIndex={0}
          aria-label="Turn the channel knob"
          className="tv-knob"
          style={{ left: pct(KNOB.x - KNOB.d / 2), top: pct(KNOB.y - KNOB.d / 2), width: pct(KNOB.d), height: pct(KNOB.d) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/tv-knob.webp" alt="" draggable={false} />
        </div>
        <button
          className="tv-btn"
          style={{ left: pct(VOL.x - VOL.d / 2), top: pct(VOL.y - VOL.d / 2), width: pct(VOL.d), height: pct(VOL.d) }}
          onClick={() => {
            const unmute = stage.muted;
            setMuted(!unmute);
            // visitors who started muted get the beat-reactive page once they unmute
            if (unmute) startAudio();
            resumeAudio();
          }}
          aria-label="Mute"
          aria-pressed={muted}
        />
        <button
          className="tv-btn"
          style={{ left: pct(PWR.x - PWR.d / 2), top: pct(PWR.y - PWR.d / 2), width: pct(PWR.d), height: pct(PWR.d) }}
          onClick={() => setPower(!stage.power)}
          aria-label="Power"
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
