"use client";

// SHARE HOOK: the wedding invitation (کارت عروسی). Type your name, the card
// writes itself, it slides out of its envelope, and it carries the shabash
// you threw. Download / share renders a 1080×1920 story PNG: your card in a
// shower of bills (the more shabash you threw, the more money on it), with
// the credit handle.

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { credit, credits, song } from "@/lib/data";
import { faNum } from "@/lib/fa";
import { on, stage } from "@/lib/stage";
import { BILL_H, BILL_W, drawBillAtlas } from "./bill-texture";

gsap.registerPlugin(ScrollTrigger, useGSAP);

async function renderCard(name: string, shabash: number) {
  await document.fonts.ready;
  const cs = getComputedStyle(document.body);
  const LALE = cs.getPropertyValue("--font-lalezar").trim();
  const MIRZA = cs.getPropertyValue("--font-mirza").trim();
  const VT = cs.getPropertyValue("--font-vt").trim();
  const MARK = cs.getPropertyValue("--font-markazi").trim();
  const W = 1080;
  const H = 1350; // the card itself
  const SH = 1920; // the story canvas around it
  const TOP = 285;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = SH;
  const g = c.getContext("2d")!;

  // night hall, warm glow behind the card
  g.fillStyle = "#0d0a07";
  g.fillRect(0, 0, W, SH);
  const glow = g.createRadialGradient(W / 2, SH / 2, 100, W / 2, SH / 2, 1000);
  glow.addColorStop(0, "#3d2e1c");
  glow.addColorStop(1, "#0d0a07");
  g.fillStyle = glow;
  g.fillRect(0, 0, W, SH);

  // shabash shower: more bills the more you threw
  const atlas = drawBillAtlas(LALE, MARK);
  const bill = (x: number, y: number, w: number, rot: number) => {
    const back = Math.random() < 0.4;
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(1, 0.55 + Math.random() * 0.45); // foreshortened, like it's mid-flip
    g.shadowColor = "rgba(0,0,0,0.5)";
    g.shadowBlur = 18;
    g.drawImage(atlas, 0, back ? BILL_H + 4 : 0, BILL_W, BILL_H, -w / 2, (-w * BILL_H) / BILL_W / 2, w, (w * BILL_H) / BILL_W);
    g.restore();
  };
  const count = 10 + Math.min(40, Math.round(shabash / 2));
  for (let i = 0; i < count; i++) {
    const y = Math.random() < 0.5 ? Math.random() * (TOP + 160) : SH - Math.random() * (TOP + 160);
    bill(Math.random() * W, y, 150 + Math.random() * 170, (Math.random() - 0.5) * 2.4);
  }

  g.save();
  g.translate(0, TOP);
  // card
  const grd = g.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, "#f6eedd");
  grd.addColorStop(1, "#e8dcc2");
  g.fillStyle = grd;
  g.fillRect(70, 70, W - 140, H - 140);
  const gold = g.createLinearGradient(0, 0, W, 0);
  gold.addColorStop(0, "#9c6b1c");
  gold.addColorStop(0.5, "#f3d27a");
  gold.addColorStop(1, "#9c6b1c");
  g.strokeStyle = gold;
  g.lineWidth = 10;
  g.strokeRect(100, 100, W - 200, H - 200);
  g.lineWidth = 2;
  g.strokeRect(122, 122, W - 244, H - 244);

  g.textAlign = "center";
  g.direction = "rtl";
  g.fillStyle = "#6d4a12";
  g.font = `56px ${MIRZA}`;
  g.fillText("✦  ✧  ✦", W / 2, 230);
  g.fillStyle = "#2b1d0c";
  g.font = `64px ${MIRZA}`;
  g.fillText(`${name || "مهمان"} عزیز`, W / 2, 340);
  g.font = `44px ${MIRZA}`;
  g.fillText(song.teaser.fa, W / 2, 420);
  g.fillStyle = gold;
  g.font = `300px ${LALE}`;
  g.fillText(song.fa, W / 2, 720);
  g.fillStyle = "#2b1d0c";
  g.font = `52px ${MIRZA}`;
  g.fillText(`با هنرنمایی ${song.artists.fa.replace("×", "و")}`, W / 2, 820);
  g.font = `40px ${MIRZA}`;
  g.fillText(`زمان: ${song.released.fa}   ·   مکان: همه‌جا`, W / 2, 900);
  g.fillStyle = "#8b1d26";
  g.font = `48px ${MIRZA}`;
  g.fillText(`شاباش شما: ${faNum(shabash)} دلار`, W / 2, 990);
  g.direction = "ltr";
  g.fillStyle = "#6d5a3a";
  g.font = `30px ${VT}`;
  credits.slice(0, 4).forEach((cr, i) => g.fillText(`${cr.en.toUpperCase()}  ${cr.names}`, W / 2, 1075 + i * 34));
  g.fillStyle = "#2b1d0c";
  g.font = `34px ${VT}`;
  g.fillText(`${credit.handle}  ·  unofficial fan-made`, W / 2, H - 150);
  g.restore();

  // a few bills land on the card's edges
  for (let i = 0; i < 4; i++) bill(Math.random() < 0.5 ? 60 + Math.random() * 160 : W - 60 - Math.random() * 160, TOP + 80 + Math.random() * (H - 160), 160, (Math.random() - 0.5) * 2);

  return new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));
}

export function Invite() {
  const root = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [shabash, setShabash] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => on<number>("shabash", (n) => setShabash(n)), []);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        ".invite-card",
        { yPercent: 62, rotate: -4 },
        { yPercent: 0, rotate: 0, ease: "power2.out", scrollTrigger: { trigger: ".envelope", start: "top 85%", end: "top 15%", scrub: 0.6 } },
      );
      gsap.fromTo(
        ".envelope-flap",
        { rotateX: 0 },
        { rotateX: 180, ease: "power1.inOut", scrollTrigger: { trigger: ".envelope", start: "top 95%", end: "top 60%", scrub: 0.4 } },
      );
    },
    { scope: root },
  );

  const share = async (download: boolean) => {
    setBusy(true);
    try {
      const blob = await renderCard(name.trim(), stage.shabash);
      if (!blob) return;
      const file = new File([blob], "vay-invite.png", { type: "image/png" });
      if (!download && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${song.fa} — ${song.artists.fa}` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "vay-invite.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch {
      /* share sheet closed */
    } finally {
      setBusy(false);
    }
  };

  return (
    <section ref={root} id="invite" className="invite" aria-label="Your invitation / کارت دعوت">
      <header className="invite-head">
        <h2 dir="rtl">کارت دعوت</h2>
        <p dir="ltr" lang="en">your invitation: write your name, send it to a friend</p>
      </header>

      <div className="invite-grid">
        <div className="envelope" aria-hidden={false}>
          <div className="envelope-back" />
          <article className="invite-card" dir="rtl">
            <p className="ic-orn" aria-hidden>✦ ✧ ✦</p>
            <p className="ic-name">{name.trim() || "مهمان"} عزیز</p>
            <p className="ic-teaser">{song.teaser.fa}</p>
            <p className="ic-word">{song.fa}</p>
            <p className="ic-line">با هنرنمایی {song.artists.fa.replace("×", "و")}</p>
            <p className="ic-meta">
              زمان: {song.released.fa}
              <br />
              مکان: همه‌جا
            </p>
            <p className="ic-shabash">شاباش شما: {faNum(shabash)} دلار</p>
            <ul className="ic-credits" dir="ltr">
              {credits.map((c) => (
                <li key={c.en}>
                  <span>{c.en}</span> {c.names}
                </li>
              ))}
            </ul>
          </article>
          <div className="envelope-front" />
          <div className="envelope-flap" />
        </div>

        <div className="invite-form">
          <label htmlFor="guest" className="invite-label">
            <span dir="rtl">اسمت چیه؟</span>
            <span dir="ltr" lang="en">your name</span>
          </label>
          <input
            id="guest"
            dir="auto"
            maxLength={22}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مهمان"
            autoComplete="off"
          />
          <p className="invite-note" dir="rtl">
            {shabash > 0 ? `تا الان ${faNum(shabash)} دلار شاباش دادی. روی کارتت هست.` : "یه کم شاباش بریز، روی کارتت ثبت می‌شه."}
          </p>
          <div className="invite-actions">
            <button onClick={() => share(false)} disabled={busy}>
              بفرست <span className="en" lang="en">share</span>
            </button>
            <button onClick={() => share(true)} disabled={busy} className="ghost">
              دانلود <span className="en" lang="en">download</span>
            </button>
          </div>
          <a className="invite-stream" href={song.stream} target="_blank" rel="noreferrer">
            همه‌جا پخش می‌شه <span className="en" lang="en">stream VAY everywhere</span>
          </a>
        </div>
      </div>
    </section>
  );
}
