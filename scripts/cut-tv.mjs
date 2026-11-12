// Turn the AI-generated TV (green screen) into the site's TV layer.
// - keys the #00FF00 screen out to full transparency (with a soft, de-spilled edge)
// - measures the screen hole and writes it to src/lib/tv-geometry.json (fractions of the image)
// usage: node scripts/cut-tv.mjs <tv.webp|png>
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/cut-tv.mjs <tv image>");
const root = join(import.meta.dirname, "..");

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;

// "greenness": how much green beats the other two channels
const greenness = (r, g, b) => g - Math.max(r, b);

// pass 1: find the screen (bright chroma green only, so the rose leaves never count)
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 10) continue;
    if (greenness(r, g, b) > 120 && g > 180) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

// pass 2: key only inside the screen box (+ a few px of edge)
const M = 8;
for (let y = Math.max(0, minY - M); y <= Math.min(H - 1, maxY + M); y++) {
  for (let x = Math.max(0, minX - M); x <= Math.min(W - 1, maxX + M); x++) {
    const i = (y * W + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    const k = greenness(r, g, b);
    // soft key: fully transparent above 90, ramp between 25 and 90
    if (k > 25 && g > 90) {
      const t = Math.min(1, (k - 25) / 65);
      data[i + 3] = Math.round(a * (1 - t));
      // de-spill: pull green down to the max of red/blue on the remaining edge
      data[i + 1] = Math.max(r, b);
    }
  }
}

await sharp(data, { raw: { width: W, height: H, channels: 4 } })
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toFile(join(root, "public", "media", "tv.webp"));

const geo = {
  width: W,
  height: H,
  // the screen hole, as fractions of the image (for CSS positioning)
  screen: {
    left: +(minX / W).toFixed(4),
    top: +(minY / H).toFixed(4),
    width: +((maxX - minX + 1) / W).toFixed(4),
    height: +((maxY - minY + 1) / H).toFixed(4),
  },
};
writeFileSync(join(root, "src", "lib", "tv-geometry.json"), JSON.stringify(geo, null, 2) + "\n");
console.log("tv.webp written", geo);
