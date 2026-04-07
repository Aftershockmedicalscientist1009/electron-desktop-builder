/**
 * generate-icons.cjs — One-off script to create icon assets from logo.svg.
 * Run: node script/generate-icons.cjs
 * Requires: npm install --no-save sharp to-ico
 */
const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'client', 'public', 'logo.svg');
const assetsDir = path.join(__dirname, '..', 'assets');

async function generate() {
  const svg = fs.readFileSync(svgPath);

  // 512x512 PNG for splash screen
  await sharp(svg).resize(512, 512).png().toFile(path.join(assetsDir, 'icon.png'));
  console.log('icon.png (512x512)');

  // ICO files for Windows (tray, taskbar, installer)
  const sizes = [16, 32, 48, 256];
  for (const size of sizes) {
    const pngBuf = await sharp(svg).resize(size, size).png().toBuffer();
    const icoBuf = await toIco([pngBuf]);
    const name = `icon${size}x${size}.ico`;
    fs.writeFileSync(path.join(assetsDir, name), icoBuf);
    console.log(`${name} (${icoBuf.length} bytes)`);
  }

  console.log('All icons generated in assets/');
}

generate().catch(e => { console.error(e); process.exit(1); });
