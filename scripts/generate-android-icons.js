/**
 * Generate Android launcher icons: white background, logo centered, equal padding.
 * Output: mipmap folders - ic_launcher.png and ic_launcher_round.png
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE_LOGO = path.join(ROOT, 'mobile-app', 'supplier', 'image-removebg-preview - 2026-03-25T030636.938.png');
const LOGO_MARK = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable', 'app_logo_mark.png');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function generate() {
  const trimmed = await sharp(SOURCE_LOGO).ensureAlpha().trim().toBuffer();
  const markCanvas = 432;
  const markLogoSize = 200;
  const markLeft = Math.round((markCanvas - markLogoSize) / 2);
  const markTop = Math.round((markCanvas - markLogoSize) / 2);
  const markLogo = await sharp(trimmed)
    .resize(markLogoSize, markLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const markPng = await sharp({
    create: {
      width: markCanvas,
      height: markCanvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: markLogo, left: markLeft, top: markTop }])
    .png()
    .toBuffer();
  fs.writeFileSync(LOGO_MARK, markPng);

  const logoBuffer = await sharp(LOGO_MARK).ensureAlpha().toBuffer();

  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = path.join(RES, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const padded = await sharp(logoBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const composed = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    })
      .composite([{ input: padded, left: 0, top: 0 }])
      .png()
      .toBuffer();

    const outLauncher = path.join(dir, 'ic_launcher.png');
    const outRound = path.join(dir, 'ic_launcher_round.png');
    const outForeground = path.join(dir, 'ic_launcher_foreground.png');
    fs.writeFileSync(outLauncher, composed);
    fs.writeFileSync(outRound, composed);
    const fgSize = FOREGROUND_SIZES[folder] || size;
    const fgPng = await sharp(logoBuffer)
      .resize(fgSize, fgSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    fs.writeFileSync(outForeground, fgPng);
    console.log('OK', folder, size + 'px');
  }
  console.log('Done. ic_launcher and ic_launcher_round updated in all mipmap folders.');
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
