# VAY — creative direction

Song site (not an artist site): «وای» by KIXTY × MERSAD, released Thursday 21 Aban 1405 (12 Nov 2026).

## 1. The line

**«این سایت نوار عروسیه» — "the site is the wedding tape."**
Source: the track is a 6/8 (شش و هشت) wedding beat; the video is a wedding party (black suits, white shirts, silver tinsel curtains, money on the table); the interlude is literally a wedding MC («ممنونم از عزیزانی که اومدین مراسم»); the lyrics name **shabash** («می‌گه شاباش من چی») and **TV channels** («آنتن نمی‌دی می‌زنن کانال بعدی»); their own teaser caption reads like an invite: «آخر هفته با دست و جیغ و هورا منتظریم» (bible ✅).

## 2. Signature moment

**Flick anywhere → you throw shabash**, the way it is really thrown at a wedding. Tap = a toss straight up; a fast flick = bills peel off your hand in the direction and speed of the flick (sideways flicks on touch, so vertical swipes still scroll). Real 3D paper dollars tumble, slow down and flutter over the TV that plays the video, while a counter adds up your dollars. Holding still does nothing. The 3-second reel shot: the TV playing the wedding video, a hand flicks across the screen, a spray of bills follows it.

## 3. Tokens

| Role | Hex |
|---|---|
| night hall (page) | `#0d0a07` |
| sepia wall (secondary text) | `#b9a77f` |
| lace cream (text) | `#f1e6cf` |
| shabash gold (titles, active) | `#e8b64a` |
| VCR blue (loader, rewind) | `#1530c4` |
| rose red (ad-libs, card) | `#d0213a` |

Type: **Lalezar** (lyric wall, big words: Tehran shop-sign retro) + **Mirza** (wedding-card script) + **Markazi Text** (body) + **VT323** (VCR on-screen display, Latin echo).

## 4. Section map

```
┌ LOADER ── VCR-blue screen, VHS cassette «عروسیِ وای», ▶ پخش ─────────┐
│  tap → tape slides into the deck → "▶ PLAY" noise → screen shrinks   │
│  INTO the TV glass                                                    │
├ HERO ─ tinsel curtain · giant gold «وای» behind the roses ────────────┤
│        [ TV playing the video ]  names fa (right) / en (left)        │
│        «هر جا نگه داری، شاباش می‌ریزه»                                 │
├ LYRICS ─ TV stays pinned centre (smaller) ────────────────────────────┤
│   wedding title card «ورس ۱ — کیکستی»                                 │
│   Kixty lines swing in from the right, Mersad's from the left,        │
│   lines pass BEHIND the TV; (وای) ad-libs bounce on the kick          │
├ ALBUM ─ TV shrinks to a corner and keeps playing ─────────────────────┤
│   آلبوم عروسی: RTL book, 12 stills from the video, ▶ time = jump     │
├ INVITE ─ envelope opens, card «{name} عزیز» + your shabash ───────────┤
├ END ─ «با تشکر از حضور گرم شما» · TV switches off · ◀◀ از اول ─────────┤
└────────────────────────────────────────────────────────────────────────┘
fixed on top of everything: shabash rain (2 layers), counter pill, VCR ▶▶/◀◀ OSD
```

## 5. Verb map

| Section | Verb | What it does | Engine |
|---|---|---|---|
| Loader | tap | tape goes in, screen shrinks into the TV | GSAP clip-path |
| Hero | **flick / tap** (signature) | throw shabash off your hand, in the flick's direction | ShabashRain (WebGL2) |
| TV | turn / press | channel knob drag (colour → B&W → برفک), volume, power | CRT shader |
| Lyrics | scroll-scrub | lines swing in 6/8 behind the pinned TV; synced line glows, click = seek | GSAP ScrollTrigger + stage clock |
| Album | drag | turn real 3D pages (RTL; top-bound on phones) | CSS 3D flip |
| Invite | type | your name writes the card; share/download PNG | canvas render |
| End | press | ◀◀ REWIND: page + tape back to 00:00 | Lenis + VCR OSD |
| Everywhere | fast scroll | ▶▶ FF / ◀◀ REW OSD + tracking band | VcrOsd |

## 6. Gallery

The **wedding album** (آلبوم عروسی): a real book that opens right-to-left like a Persian book, gold heart/oval/arch/cornered frames, plastic-sleeve glare that slides as the page bends, glitter stars. Fed by 12 stills pulled from the video with ffmpeg (scene detection). Each photo has its timestamp; tapping it makes the corner TV play from that shot, so the album is also a way into the video.

## 7. New engines

- **ShabashRain** (`src/components/Rain.tsx`): WebGL2 instanced paper. Each bill is a 12×4 mesh bent by a curl term + a travelling flutter wave, rotated in 3D, lit by its normal (flashes as it flips), front/back faces from one atlas drawn at runtime. CPU sim: thrown impulse → gravity → air drag relaxes to a terminal flutter fall; scroll delta is wind; kick drum drops bills from the ceiling. Two contexts (behind / in front of the TV) for depth.
- **CRT tape TV** (`Tv.tsx` + `crt-shader.ts`): AI TV image with a green screen keyed out by `scripts/cut-tv.mjs` (which also measures the hole); video texture behind it with barrel glass, scanlines, slot mask, VHS jitter + tracking band, channel modes, a real power-off collapse, beat-driven chroma.
- **Beat conductor** (`src/lib/stage.ts`): Web Audio analyser on the self-hosted video; bass-band onset detection drives `--beat` (ad-libs), TV hop, tinsel shake and rain.
- **Lyric cues**: when synced, «آنتن نمی‌دی…» flips the TV channel and the shabash line rains 60 bills.
- **Tinsel curtain** (`Tinsel.tsx`): canvas strands as damped pendulums of flickering foil glints; your cursor pushes through them.

## 8. Share hook

**Your wedding invitation** (کارت دعوت): type a name, the card shows «{name} عزیز», their teaser line, «وای», date, «مکان: همه‌جا», and **your shabash total**. Share/Download renders a **1080×1920 story** PNG: your card in a shower of bills drawn from the rain atlas (the more shabash you threw, the more money around it), credit handle at the bottom of the card.

## 9. Ledger diff (vs sepehr-khalse)

- Concept: B&W/colour trance dream → a 1370s wedding VHS tape.
- Palette: monochrome + earned album colour → warm night hall, gold, VCR blue, rose.
- Type: Nastaliq + Vazirmatn + Archivo → Lalezar + Mirza + Markazi + VT323.
- Signature: press-and-hold → colour floods in → **flick** → money flies off your hand along the flick (physical objects with direction, not a shader wash; no hold anywhere on this site).
- Loader: Persian-digit counter + eyelids → VHS insert + screen shrinks into a TV.
- Hero: liquid Nastaliq canvas word → physical TV playing the video, gold word behind real roses, tinsel curtain.
- Gallery: reel wall / record crate / burn → a page-turning wedding album.
- Story device: horizontal timeline → lyric wall behind a pinned TV.
- Signature sections: crew names / split-flap → invitation card, VCR deck controls.
- End: giant name lit under cursor → thank-you card + TV power-off + rewind.
- Sound: none → the whole page listens to the song (beat conductor).
- Share hook: Sepehr freezes a shader frame into a 4:5 card (names, tagline) → here a 9:16 story of a personal invitation: the visitor's typed name + their own shabash total, with their thrown money drawn around it.

## 10. Changed vs generic defaults

- No hero headline + subhead: the hero is an object (a TV) with the song playing in it.
- No section fade-ups: each section has its own verb (see 5).
- No numbered sections, no eyebrow labels: section titles are wedding title cards and album/card headers.
- English is an echo in VT323, as if the VCR is subtitling the Persian.
- Not "near-black + one neon": warm sepia night + metallic gold gradient + one VCR blue used only for the tape (loader, rewind).

## 11. Fallbacks

- No WebGL: the TV shows the raw `<video>` (object-fit cover) inside the same cut-out; no rain (the counter still works).
- Reduced motion: no Lenis, no rain, no tinsel motion, no lyric swings, no grain/blink animations; shader time frozen; the loader fades instead of shrinking.
- Low-power phones: DPR capped (rain 1.5, CRT 1.5), fewer bills (9 + 4), tinsel pauses off-screen, all loops stop when the tab is hidden.
- Autoplay with sound refused: plays muted, the volume knob unmutes.

## 12. Reel shots

1. Black → VCR blue, the tape label «عروسیِ وای», finger taps ▶ پخش, the screen shrinks into the TV (3 s).
2. Flick across the hero: a spray of shabash bills follows the hand over the TV while the song hits the 6/8 beat.
3. Turn the channel knob: snow (برفک) → black & white.
4. Scroll fast: ◀◀ REW over the lyrics wall passing behind the TV.
5. Album page turn with the glare sliding; tap ▶ and the corner TV jumps.
6. Type a friend's name on the invite, share sheet opens.
7. End card, the TV collapses to a dot.
