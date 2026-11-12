// Convert any image (webp/png/jpg) into the JPG names the site expects.
// usage: node scripts/import-media.mjs <src> <name.jpg> [<src> <name.jpg> ...]
import sharp from "sharp";
import { join } from "node:path";

const args = process.argv.slice(2);
const out = join(import.meta.dirname, "..", "public", "media");

for (let i = 0; i < args.length; i += 2) {
  const [src, name] = [args[i], args[i + 1]];
  const info = await sharp(src)
    .flatten({ background: "#000000" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(join(out, name));
  console.log("OK", name, `${info.width}x${info.height}`, Math.round(info.size / 1024) + "KB");
}
