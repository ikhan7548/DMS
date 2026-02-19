const sharp = require('sharp');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'DD_logo.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'client', 'public');

async function generateIcons() {
  console.log('Generating PWA icons from DD_logo.png...');

  // 512x512 - main PWA icon with padding for maskable safe zone
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(SOURCE)
          .resize(300, null, { fit: 'inside' })
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png()
    .toFile(path.join(OUTPUT_DIR, 'logo-512.png'));
  console.log('  ✓ logo-512.png (512x512)');

  // 192x192 - smaller PWA icon
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(SOURCE)
          .resize(115, null, { fit: 'inside' })
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png()
    .toFile(path.join(OUTPUT_DIR, 'logo-192.png'));
  console.log('  ✓ logo-192.png (192x192)');

  // 64x64 - favicon
  await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(SOURCE)
          .resize(48, null, { fit: 'inside' })
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon.png'));
  console.log('  ✓ favicon.png (64x64)');

  console.log('Done! All icons generated in client/public/');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
