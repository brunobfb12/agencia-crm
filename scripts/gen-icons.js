// Generates PWA icons using sharp (already a Next.js dep)
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// SVG icon: indigo background + white "F" letter
const makeSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#6366f1"/>
  <text x="50%" y="54%" font-family="Arial,sans-serif" font-size="${size * 0.55}"
    font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">F</text>
</svg>`;

async function gen(size) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).png().toFile(path.join(outDir, `icon-${size}.png`));
  console.log(`icon-${size}.png created`);
}

Promise.all([gen(192), gen(512)]).then(() => console.log('Done'));
