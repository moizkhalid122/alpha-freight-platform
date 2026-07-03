import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = join(root, "public", "logo.png");

async function logoOnlyBuffer() {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Uint8ClampedArray.from(data);
  const threshold = 40;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (r <= threshold && g <= threshold && b <= threshold) {
      pixels[i + 3] = 0;
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
}

async function buildSquareIcon(size) {
  const logoOnly = await logoOnlyBuffer();

  return sharp(logoOnly)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

const icon512 = await buildSquareIcon(512);
const icon32 = await buildSquareIcon(32);

const outputs = [
  [join(root, "src", "app", "icon.png"), icon512],
  [join(root, "src", "app", "apple-icon.png"), icon512],
  [join(root, "public", "favicon.png"), icon32],
  [join(root, "public", "apple-touch-icon.png"), icon512],
];

for (const [path, buffer] of outputs) {
  writeFileSync(path, buffer);
}

console.log("Alpha Freight favicons generated — logo only, no black bars");
