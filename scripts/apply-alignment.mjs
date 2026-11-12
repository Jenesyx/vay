// Turn a stable-ts alignment (align.json: one segment per lyric line, with words)
// into src/lib/timings.json: a start time per line + a start time per rendered word
// span (same tokenising as <Line> in Lyrics.tsx: ad-lib "(…)" = one span).
// usage: node scripts/apply-alignment.mjs <align.json> [transcript.json]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const [alignPath, transcriptPath] = process.argv.slice(2);
const segs = JSON.parse(readFileSync(alignPath, "utf8"));
const { flatLines } = await import(join(root, "src", "lib", "data.ts").replace(/\\/g, "/").replace(/^([A-Z]):/, "file:///$1:"));

// same cleaning as the aligner
const clean = (t) =>
  t
    .replace(/[()]/g, " ")
    .replace(/\s-\s/g, " ")
    .replace(/-/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** how many aligned words each rendered span consumes */
function spanTokenCounts(text) {
  const bits = text.split(/(\([^)]*\)?)/g).filter(Boolean);
  const out = [];
  for (const b of bits) {
    if (b.startsWith("(")) out.push(clean(b).split(" ").filter(Boolean).length);
    else for (const w of b.split(/\s+/).filter(Boolean)) out.push(clean(w) ? 1 : 0);
  }
  return out;
}

if (segs.length !== flatLines.length) {
  console.error(`segment count ${segs.length} ≠ line count ${flatLines.length}; aborting`);
  process.exit(1);
}

const lines = [];
const words = [];
const report = [];
let prev = -1;
segs.forEach((seg, i) => {
  const ws = seg.words.filter((w) => w.w.trim());
  let start = ws.length ? ws[0].s : null;
  // a line can't start before the previous one
  if (start !== null && start < prev) {
    report.push(`#${i} starts ${start} before previous ${prev}: dropped`);
    start = null;
  }
  if (start !== null) prev = start;
  lines.push(start === null ? null : +start.toFixed(2));

  const counts = spanTokenCounts(flatLines[i].text);
  const need = counts.reduce((a, b) => a + b, 0);
  if (start !== null && need === ws.length) {
    let k = 0;
    words.push(
      counts.map((c) => {
        if (!c) return null;
        const t = ws[k].s;
        k += c;
        return +t.toFixed(2);
      }),
    );
  } else {
    if (start !== null) report.push(`#${i} word count ${ws.length} ≠ spans ${need}: line timing only`);
    words.push(null);
  }
});

writeFileSync(join(root, "src", "lib", "timings.json"), JSON.stringify({ lines, words }) + "\n");
console.log(`timed lines ${lines.filter((x) => x !== null).length}/${lines.length}, word-timed ${words.filter(Boolean).length}`);
report.forEach((r) => console.log(" ", r));

// optional sanity check: does an independent transcription near each line's time share its letters?
if (transcriptPath) {
  const tr = JSON.parse(readFileSync(transcriptPath, "utf8"));
  const grams = (s) => {
    const t = s.replace(/[\s‌،.؟!-]/g, "");
    const g = new Set();
    for (let k = 0; k < t.length - 1; k++) g.add(t.slice(k, k + 2));
    return g;
  };
  let sum = 0;
  let n = 0;
  const weak = [];
  lines.forEach((s, i) => {
    if (s === null) return;
    const near = tr.filter((x) => x.end > s - 0.5 && x.start < s + 4).map((x) => x.text).join(" ");
    const a = grams(clean(flatLines[i].text));
    const b = grams(near);
    const hit = [...a].filter((x) => b.has(x)).length / Math.max(1, a.size);
    sum += hit;
    n++;
    if (hit < 0.25) weak.push(`#${i} ${s}s ${(hit * 100).toFixed(0)}%  «${flatLines[i].text}»  heard: «${near.slice(0, 60)}»`);
  });
  console.log(`transcript agreement: ${((sum / n) * 100).toFixed(0)}% avg over ${n} lines; weak lines: ${weak.length}`);
  weak.forEach((w) => console.log(" ", w));
}
