import { song } from "@/lib/data";
import { Tinsel } from "./Tinsel";

export function Hero() {
  return (
    <section className="hero" aria-label={`${song.en} — ${song.artists.en}`}>
      <Tinsel />
      <h1 className="hero-word">
        <span className="hero-word-fill">{song.fa}</span>
        <span className="sr-only"> — {song.en}, {song.artists.en}</span>
      </h1>

      <div className="hero-side hero-fa" dir="rtl">
        <p className="hero-names">{song.artists.fa}</p>
        <p className="hero-date">{song.released.fa}</p>
      </div>
      <div className="hero-side hero-en" dir="ltr" lang="en">
        <p className="hero-names">{song.artists.en}</p>
        <p className="hero-date">{song.released.en}</p>
      </div>

      <p className="hero-hint">
        <span dir="rtl">بکش و پرت کن، شاباش بریز</span>
        <span dir="ltr" lang="en">
          flick (or tap) to throw shabash
        </span>
      </p>
    </section>
  );
}
