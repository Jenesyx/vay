# VAY — KIXTY × MERSAD

Unofficial fan-made site for the song «وای» (VAY) by KIXTY × MERSAD. Not affiliated with the artists or their team; the song, video and lyrics belong to them.

The site is a 1370s wedding VHS tape: a CRT TV playing the video, shabash money you throw, a karaoke lyric wall that follows the singing, a wedding album of stills, and a shareable invitation card.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (what Vercel runs)
```

## Content

- Everything on the page: `src/lib/data.ts`
- Lyric timings (line + word start times): `src/lib/timings.json`
- Media: `public/media/` (`vay.mp4` desktop, `vay-sm.mp4` phones)

## Re-timing the lyrics

- By hand: run `npm run dev`, open `/sync`, press Space at the start of each line, save. (Dev only; `/sync` is a 404 in production.)
- Automatically: align the audio with Whisper (stable-ts), then `node --experimental-strip-types scripts/apply-alignment.mjs <align.json>`.

## Deploy

Vercel, default Next.js settings. Before posting: check the site opens from inside Iran.
