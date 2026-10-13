/** Клиентский киберпанк-фильтр для портретов (canvas). */

/** Держим data:URL в лимите NRI_PORTRAIT_URL_MAX (~350k). */
const MAX_EDGE = 360;
const JPEG_QUALITY = 0.72;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Не удалось прочитать изображение'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
}

/** Контраст + cyan/magenta shift + лёгкий vignette + scanlines. */
export function applyCyberpunkFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): void {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let i = 0; i < d.length; i += 4) {
    const px = (i / 4) % w;
    const py = Math.floor(i / 4 / w);
    let r = d[i]!;
    let g = d[i + 1]!;
    let b = d[i + 2]!;

    // контраст
    r = (r - 128) * 1.22 + 128;
    g = (g - 128) * 1.18 + 128;
    b = (b - 128) * 1.28 + 128;

    // холодный cyan / magenta split
    r = r * 0.92 + 18;
    g = g * 1.05 + 8;
    b = b * 1.18 + 22;

    // vignette
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2) / maxDist;
    const vig = 1 - dist * 0.45;
    r *= vig;
    g *= vig;
    b *= vig;

    // scanline
    if (py % 3 === 0) {
      r *= 0.82;
      g *= 0.88;
      b *= 0.95;
    }

    d[i] = Math.max(0, Math.min(255, r));
    d[i + 1] = Math.max(0, Math.min(255, g));
    d[i + 2] = Math.max(0, Math.min(255, b));
  }
  ctx.putImageData(img, 0, 0);

  // тонкая неоновая обводка / глитч-полоски
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(0, 255, 255, 0.06)';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255, 0, 170, 0.05)';
  for (let y = 0; y < h; y += 47) {
    ctx.fillRect(0, y, w, 2);
  }
  ctx.restore();
}

export async function processPortraitUpload(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Нужен файл изображения (PNG/JPG/WebP).');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Файл слишком большой (макс. 8 МБ).');
  }

  const raw = await readFileAsDataUrl(file);
  const img = await loadImage(raw);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas недоступен');

  ctx.drawImage(img, 0, 0, w, h);
  applyCyberpunkFilterToCanvas(ctx, w, h);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export const PORTRAIT_CLASS_ACCENT: Record<string, string> = {
  daimyo: '#fc9',
  doc: '#6f9',
  merc: '#f66',
  hacker: '#0ff',
  detective: '#8af',
  fixer: '#c8f',
};
