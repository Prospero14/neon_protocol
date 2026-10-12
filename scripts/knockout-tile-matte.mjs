/**
 * GenerateImage often writes JPEG bytes under a .png name (no alpha).
 * Flood-fills backdrop from corners → real PNG with alpha. Also copies to dist/.
 *
 * Usage:
 *   node scripts/knockout-tile-matte.mjs <src> <dest.png>
 *   node scripts/knockout-tile-matte.mjs --batch
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

async function knockoutWhite(src, dest) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const sample = (x, y) => {
    const o = (y * width + x) * channels;
    return [data[o], data[o + 1], data[o + 2]];
  };
  const bg = sample(2, 2);
  const dist3 = (r, g, b) => Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
  const visited = new Uint8Array(width * height);
  const stack = [];
  const idx = (x, y) => y * width + x;
  const isMatte = (i) => {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const a = data[o + 3];
    if (a < 8) return true;
    const br = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (dist3(r, g, b) < 48 && chroma < 45) return true;
    if (br > 165 && chroma < 40) return true;
    if (r > 220 && g > 220 && b > 220) return true;
    if (bg[0] < 25 && bg[1] < 25 && bg[2] < 25 && br < 45 && chroma < 20) return true;
    return false;
  };
  for (let x = 0; x < width; x++) stack.push(idx(x, 0), idx(x, height - 1));
  for (let y = 0; y < height; y++) stack.push(idx(0, y), idx(width - 1, y));
  while (stack.length) {
    const i = stack.pop();
    if (i < 0 || i >= width * height || visited[i]) continue;
    visited[i] = 1;
    if (!isMatte(i)) continue;
    data[i * channels + 3] = 0;
    const x = i % width;
    const y = (i / width) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < width - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - width);
    if (y < height - 1) stack.push(i + width);
  }
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    if (!data[o + 3]) continue;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const br = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (br > 195 && chroma < 50) data[o + 3] = 0;
  }
  const copy = Buffer.from(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = idx(x, y);
      const o = i * channels;
      if (copy[o + 3] < 16) continue;
      const br = (copy[o] + copy[o + 1] + copy[o + 2]) / 3;
      let nearT = false;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [1, 1],
      ]) {
        if (copy[(i + dx + dy * width) * channels + 3] < 16) {
          nearT = true;
          break;
        }
      }
      const chroma =
        Math.max(copy[o], copy[o + 1], copy[o + 2]) - Math.min(copy[o], copy[o + 1], copy[o + 2]);
      if (nearT && ((br > 120 && chroma < 55) || dist3(copy[o], copy[o + 1], copy[o + 2]) < 40)) {
        data[o + 3] = 0;
      }
    }
  }
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await sharp(data, { raw: { width, height, channels } })
    .resize(512, 512, { fit: 'inside' })
    .png()
    .toFile(dest);
  const distDest = dest.replace(`${path.sep}public${path.sep}`, `${path.sep}dist${path.sep}`);
  if (distDest !== dest) {
    await fs.promises.mkdir(path.dirname(distDest), { recursive: true });
    await fs.promises.copyFile(dest, distDest);
  }
  console.log('ok', path.basename(dest), fs.statSync(dest).size);
}

const args = process.argv.slice(2);
if (args[0] === '--batch') {
  const assetDir = path.join(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-ProsperianSun-neon-protocol-push/assets'
  );
  const pairs = [
    ['shop-southface.png', 'district-shop.png'],
    ['house-southface.png', 'district-house.png'],
    ['shack-southface.png', 'district-shack.png'],
  ];
  for (const [srcName, destName] of pairs) {
    await knockoutWhite(path.join(assetDir, srcName), path.join(root, 'public/map-tiles', destName));
  }
} else if (args.length >= 2) {
  await knockoutWhite(path.resolve(args[0]), path.resolve(args[1]));
} else {
  console.error('Usage: node scripts/knockout-tile-matte.mjs <src> <dest.png> | --batch');
  process.exit(1);
}
