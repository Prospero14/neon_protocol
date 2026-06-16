import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const inputPath =
  process.argv[2] ||
  'c:\\Users\\ProsperianSun\\Downloads\\Унгрим Железный Рог — LSS.pdf';

const bytes = new Uint8Array(fs.readFileSync(inputPath));
const doc = await pdfjs.getDocument({ data: bytes }).promise;

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const viewport = page.getViewport({ scale: 1 });
  console.log(`\n=== PAGE ${p} ${viewport.width}x${viewport.height} ===`);
  const text = await page.getTextContent();
  for (const item of text.items) {
    if (!('str' in item) || !item.str.trim()) continue;
    const [a, b, c, d, x, y] = item.transform;
    console.log(`${JSON.stringify(item.str)} @ x=${x.toFixed(1)} y=${y.toFixed(1)} size=${item.height?.toFixed?.(1) ?? '?'}`);
  }
}
