"use client";

// End of the tape: the classic wedding-video sign-off, the TV in the corner
// switches itself off (Tv.tsx watches #end), and REWIND takes you back to the
// start like a real deck: ◀◀ over the whole page, tape back to 00:00.

import { artists, credit, song } from "@/lib/data";
import { emit, seek, setFollow, stage } from "@/lib/stage";
import { getLenis } from "./SmoothScroll";

export function End() {
  const rewind = () => {
    emit("rewind", true);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
    else window.scrollTo(0, 0);
    window.setTimeout(() => {
      emit("rewind", false);
      if (stage.started) seek(0);
      // start over = follow the singing again from the first line
      setFollow(true);
    }, 2300);
  };

  return (
    <section id="end" className="end" aria-label="End">
      <p className="end-thanks" dir="rtl">
        با تشکر از
        <br />
        حضور گرم شما
      </p>
      <p className="end-en" lang="en">thank you for coming</p>

      <button className="end-rew" onClick={rewind}>
        <span>◀◀ از اول</span>
        <span className="en" lang="en">REWIND</span>
      </button>

      <footer className="end-foot">
        <div className="end-links" lang="en">
          <a href={song.stream} target="_blank" rel="noreferrer">
            {song.en} · push.fm
          </a>
          {artists.map((a) =>
            a.links.map((l) => (
              <a key={a.id + l.label} href={l.href} target="_blank" rel="noreferrer">
                {a.en} {l.label}
              </a>
            )),
          )}
        </div>
        <p className="end-legal" lang="en">
          Unofficial fan-made concept. Not affiliated with KIXTY, MERSAD or their team. The song, video and lyrics belong
          to the artists.
        </p>
        <p className="end-credit" lang="en">
          made by{" "}
          <a href={credit.href} target="_blank" rel="noreferrer">
            {credit.handle}
          </a>
        </p>
      </footer>
    </section>
  );
}
