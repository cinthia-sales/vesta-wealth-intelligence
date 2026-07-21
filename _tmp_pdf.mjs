
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';
const data = new Uint8Array(readFileSync('C:/Users/cinth/OneDrive/Documentos/INVEST/CINTHIA/XPerformance - 6414212 Cinthia - Ref.14.07.pdf'));
const pdf = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
for (let p = 1; p <= 3; p++) {
  console.log('=== PAGE', p, '===');
  const page = await pdf.getPage(p);
  const c = await page.getTextContent();
  const byY = new Map();
  for (const item of c.items) {
    if (!item.str || !item.str.trim()) continue;
    const y = Math.round(item.transform[5]);
    if (!byY.has(y)) byY.set(y, []);
    byY.get(y).push([Math.round(item.transform[4]), item.str.trim()]);
  }
  for (const [y, parts] of [...byY.entries()].sort((a,b)=>b[0]-a[0])) {
    const line = parts.sort((a,b)=>a[0]-b[0]).map(p=>p[1]).join(' | ');
    console.log(y + ': ' + line);
  }
}
