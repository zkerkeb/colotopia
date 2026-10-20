// A recorded visual review is required before artwork enters the website.
// Generation scripts write to public/images, never to this approved directory.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const directory = new URL('../src/assets/category-artwork/', import.meta.url);
const reviews = JSON.parse(await readFile(new URL('../src/data/category-artwork.json', import.meta.url), 'utf8'));
const files = (await readdir(directory)).filter(file => file.endsWith('.webp')).sort();
const expected = Object.keys(reviews).map(category => `${category}.webp`).sort();
if (JSON.stringify(files) !== JSON.stringify(expected)) {
  throw new Error('Category artwork files and visual review manifest do not match.');
}

let bytes = 0;
for (const [category, review] of Object.entries(reviews)) {
  const data = await readFile(new URL(`${category}.webp`, directory));
  const digest = createHash('sha256').update(data).digest('hex');
  if (!review.source || !review.reviewedOn || digest !== review.sha256) {
    throw new Error(`Review the illustration for ${category} and update category-artwork.json before publishing.`);
  }
  const metadata = await sharp(data).metadata();
  if (metadata.width !== 600 || metadata.height !== 600) {
    throw new Error(`Category illustration must be 600 × 600: ${category}`);
  }
  bytes += data.length;
}
console.log(`Category artwork: ${files.length} reviewed illustrations, ${Math.round(bytes / 1024)} KiB.`);
