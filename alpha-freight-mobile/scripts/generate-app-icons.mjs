import sharp from "sharp";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "assets");
const logoPath = join(assets, "logo.png");
const black = { r: 0, g: 0, b: 0, alpha: 1 };
const size = 1024;
/** ~44% — medium-small, centered; leaves room for Android adaptive icon mask */
const logoScale = 0.44;
const logoMax = Math.round(size * logoScale);

async function logoOnCanvas(canvasSize, logoSize, background) {
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const meta = await sharp(logo).metadata();
  const left = Math.round((canvasSize - (meta.width ?? logoSize)) / 2);
  const top = Math.round((canvasSize - (meta.height ?? logoSize)) / 2);

  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background,
    },
  }).composite([{ input: logo, left, top }]);
}

async function main() {
  await (await logoOnCanvas(size, logoMax, black)).png().toFile(join(assets, "icon.png"));

  await sharp({
    create: { width: size, height: size, channels: 3, background: black },
  })
    .png()
    .toFile(join(assets, "android-icon-background.png"));

  await (await logoOnCanvas(size, logoMax, { r: 0, g: 0, b: 0, alpha: 0 }))
    .png()
    .toFile(join(assets, "android-icon-foreground.png"));

  const monoLogo = await sharp(logoPath)
    .resize(logoMax, logoMax, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .greyscale()
    .linear(0, 255)
    .png()
    .toBuffer();

  const monoMeta = await sharp(monoLogo).metadata();
  const monoLeft = Math.round((size - (monoMeta.width ?? logoMax)) / 2);
  const monoTop = Math.round((size - (monoMeta.height ?? logoMax)) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: monoLogo, left: monoLeft, top: monoTop }])
    .png()
    .toFile(join(assets, "android-icon-monochrome.png"));

  await (await logoOnCanvas(48, Math.round(48 * logoScale), black)).png().toFile(join(assets, "favicon.png"));

  console.log("App icons generated from assets/logo.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
