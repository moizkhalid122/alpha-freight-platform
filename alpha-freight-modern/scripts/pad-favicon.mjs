import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "src/app/icon.source.png");
const SCALE = 0.76; // inset logo so circular SERP / tab crops show the full mark

const OUTPUTS = [
  { file: "src/app/icon.png", size: 512 },
  { file: "src/app/apple-icon.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
  { file: "public/favicon-192.png", size: 192 },
  { file: "public/favicon-48.png", size: 48 },
  { file: "public/favicon.png", size: 32 },
];

async function removeBlackBackground(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = Buffer.from(data);

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (r < 45 && g < 45 && b < 45) {
      pixels[i + 3] = 0;
    }
  }

  return sharp(pixels, { raw: { width, height, channels } }).png().toBuffer();
}

async function buildPaddedMaster() {
  const transparentLogo = await removeBlackBackground(SOURCE);
  const trimmed = await sharp(transparentLogo).trim().png().toBuffer();

  const canvasSize = 512;
  const target = Math.round(canvasSize * SCALE);

  return sharp(trimmed)
    .resize(target, target, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: Math.floor((canvasSize - target) / 2),
      bottom: Math.ceil((canvasSize - target) / 2),
      left: Math.floor((canvasSize - target) / 2),
      right: Math.ceil((canvasSize - target) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
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
