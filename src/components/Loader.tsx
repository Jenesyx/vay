"use client";

// The tape goes in: VCR-blue screen, a wedding VHS with a handwritten label.
// PLAY pushes the cassette into the deck, the blue screen flashes "▶ PLAY"
// and the whole screen shrinks INTO the TV's glass — the site is the tape.

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { lockScroll } from "./SmoothScroll";
import { setMuted, stage, startAudio, startConductor } from "@/lib/stage";

export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const tape = useRef<HTMLDivElement>(null);
  const playBtn = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "gone">("idle");

  // while the tape screen is up, the page behind it is out of reach (keyboard + screen readers)
  const behind = () => Array.from(document.querySelectorAll<HTMLElement>("main, .tv-rig, .shabash-counter"));
  useEffect(() => {
    lockScroll(true);
    behind().forEach((el) => (el.inert = true));
    // PLAY is the only thing to do on this screen
    playBtn.current?.focus({ preventScroll: true });
    return () => {
      lockScroll(false);
      behind().forEach((el) => (el.inert = false));
    };
  }, []);

  const play = (muted: boolean) => {
    if (phase !== "idle") return;
    setPhase("loading");
    const v = stage.video;
    stage.started = true;
    if (v) {
      v.preload = "auto";
      setMuted(muted);
      if (!muted) startAudio();
      v.play().catch(() => {
        // autoplay with sound refused: fall back to muted, the volume knob unmutes
        setMuted(true);
        v.play().catch(() => {});
      });
    }
    startConductor();

    const el = root.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      lockScroll(false);
      behind().forEach((x) => (x.inert = false));
      setPhase("gone");
    };
    if (reduced) {
      gsap.to(el, { autoAlpha: 0, duration: 0.3, onComplete: finish });
      return;
    }

    const screen = document.querySelector<HTMLElement>(".tv-screen");
    const r = screen?.getBoundingClientRect();
    const W = window.innerWidth;
    const H = window.innerHeight;
    const target = r
      ? `inset(${r.top}px ${W - r.right}px ${H - r.bottom}px ${r.left}px round 4%)`
      : "inset(50% 50% 50% 50% round 4%)";

    gsap
      .timeline({ onComplete: finish })
      .to(tape.current, { y: "34vh", scale: 0.86, duration: 0.55, ease: "power2.in" })
      .to(tape.current, { autoAlpha: 0, duration: 0.12 })
      .add(() => el.classList.add("is-playing"))
      .to({}, { duration: 0.55 })
      .fromTo(el, { clipPath: "inset(0px 0px 0px 0px round 0%)" }, { clipPath: target, duration: 0.9, ease: "expo.inOut" })
      .to(el, { autoAlpha: 0, duration: 0.25 });
  };

  if (phase === "gone") return null;

  return (
    <div ref={root} className="loader" role="dialog" aria-modal="true" aria-label="Start the tape" data-no-shabash>
      <div className="loader-scan" aria-hidden />
      <span className="loader-osd tl" aria-hidden>
        VIDEO 1
      </span>
      <span className="loader-osd tr" aria-hidden>
        {phase === "idle" ? "■ STOP" : "▶ PLAY"}
      </span>
      <span className="loader-osd big" aria-hidden>
        ▶ PLAY
      </span>

      <div className="loader-center">
        <div ref={tape} className="vhs" aria-hidden>
          <div className="vhs-label">
            <span className="vhs-hand">عروسیِ وای</span>
            <span className="vhs-small">KIXTY × MERSAD</span>
            <span className="vhs-e">E-180</span>
          </div>
          <div className="vhs-window">
            <span className="reel" />
            <span className="reel" />
          </div>
        </div>

        <p className="loader-hint">
          <span dir="rtl">نوار عروسی رو بذار تو دستگاه</span>
          <span dir="ltr" lang="en">
            put the wedding tape in
          </span>
        </p>

        <button ref={playBtn} className="loader-play" onClick={() => play(false)} disabled={phase !== "idle"}>
          <span>▶ پخش</span>
          <span className="en" lang="en">
            PLAY
          </span>
        </button>
        <button className="loader-mute" onClick={() => play(true)} disabled={phase !== "idle"}>
          بی‌صدا / <span lang="en">without sound</span>
        </button>
      </div>
      <div className="vcr-slot" aria-hidden />
    </div>
  );
}
