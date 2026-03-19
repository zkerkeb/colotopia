/**
 * optimize-images.mjs
 * Pre-build script: converts PNG coloriages to WebP (full-size + 300px thumbnails).
 * Run via: node scripts/optimize-images.mjs
 * Original PNGs are preserved for PDF generation.
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'coloriages');
const THUMBS_DIR = path.join(IMAGES_DIR, 'thumbs');
const THUMB_WIDTH = 300;
const WEBP_QUALITY = 82;

async function run() {
  if (!existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  await mkdir(THUMBS_DIR, { recursive: true });

  const files = (await readdir(IMAGES_DIR)).filter(
    (f) => f.endsWith('.png') && !f.startsWith('.')
  );

  console.log(`Converting ${files.length} PNG images to WebP...`);

  let converted = 0;
  let skipped = 0;

  for (const file of files) {
    const baseName = path.basename(file, '.png');
    const srcPath = path.join(IMAGES_DIR, file);
    const webpPath = path.join(IMAGES_DIR, `${baseName}.webp`);
    const thumbPath = path.join(THUMBS_DIR, `${baseName}.webp`);

    // Full-size WebP (for detail page hero)
    await sharp(srcPath)
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    // 300px-wide thumbnail WebP (for card grid)
    await sharp(srcPath)
      .resize(THUMB_WIDTH)
      .webp({ quality: WEBP_QUALITY })
      .toFile(thumbPath);

    converted++;
    if (converted % 20 === 0) {
      console.log(`  ${converted}/${files.length} done...`);
    }
  }

  console.log(`Done: ${converted} images converted, ${skipped} skipped.`);
  console.log(`  Full-size WebP: ${IMAGES_DIR}/*.webp`);
  console.log(`  Thumbnails:     ${THUMBS_DIR}/*.webp`);
}

run().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
