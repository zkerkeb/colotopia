import fs from 'node:fs';
import sharp from 'sharp';

const aliases = JSON.parse(fs.readFileSync(new URL('../../src/data/legacy-image-aliases.json', import.meta.url)));
const CDN = 'https://cdn.colotopia.com';

export function coloringKey(input) {
  let value = String(input ?? '').trim().split(/[?#]/)[0];
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (url.origin !== CDN) throw new Error('Unsupported image origin');
    value = url.pathname;
  }
  const key = value.replace(/^\/+/, '')
    .replace(/^(?:images\/coloriages|coloriages\/thumbs|coloriages)\//, '')
    .replace(/\.(?:png|webp|jpe?g)$/i, '');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(key)) throw new Error('Invalid coloring image key');
  return aliases[key] ?? key;
}

export function selectApprovedColorings(rows, approvedImages) {
  if (!Array.isArray(approvedImages) || !approvedImages.length) throw new Error('An explicit list of approved image keys is required');
  const approved = new Set(approvedImages.map(coloringKey));
  const available = new Set(rows.map(row => coloringKey(row.image)));
  for (const key of approved) if (!available.has(key)) throw new Error(`Approved image has no metadata: ${key}`);
  // Select both languages by their shared asset, never just the FR row.
  return rows.filter(row => approved.has(coloringKey(row.image)));
}

export async function verifyPublishedArtwork(input, fetcher = fetch) {
  const key = coloringKey(input);
  for (const suffix of [`${key}.png`, `${key}.webp`, `thumbs/${key}.webp`]) {
    const response = await fetcher(`${CDN}/coloriages/${suffix}`, { signal: AbortSignal.timeout(20000), redirect: 'error' });
    if (!response.ok) throw new Error(`${suffix}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(bytes).metadata();
    const expectedFormat = suffix.endsWith('.png') ? 'png' : 'webp';
    if (metadata.format !== expectedFormat || Math.min(metadata.width, metadata.height) < (suffix.startsWith('thumbs/') ? 100 : 600)) {
      throw new Error(`${suffix}: invalid image format or dimensions`);
    }
    await sharp(bytes).raw().toBuffer();
  }
  return key;
}
