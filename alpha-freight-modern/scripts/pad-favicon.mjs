import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "src/app/icon.source.png");
const SCALE = 0.76; // inset logo so circular SERP crops show the full mark

const OUTPUTS = [
  { file: "src/app/icon.png", size: 512 },
  { file: "src/app/apple-icon.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
  { file: "public/favicon-192.png", size: 192 },
  { file: "public/favicon-48.png", size: 48 },
  { file: "public/favicon.png", size: 32 },
];

async function buildPaddedMaster() {
  const meta = await sharp(SOURCE).metadata();
  const canvas = meta.width ?? 512;
  const target = Math.round(canvas * SCALE);

  return sharp(SOURCE)
    .resize(target, target, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.floor((canvas - target) / 2),
      bottom: Math.ceil((canvas - target) / 2),
      left: Math.floor((canvas - target) / 2),
      right: Math.ceil((canvas - target) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function main() {
  const master = await buildPaddedMaster();

  for (const { file, size } of OUTPUTS) {
    const outPath = path.join(ROOT, file);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    await sharp(master).resize(size, size).png().toFile(outPath);
    console.log(`Wrote ${file} (${size}x${size})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
