import { getCollection } from 'astro:content';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Returns coloriages that have a corresponding image file on disk.
 * Prevents pages from being generated for content stubs without images.
 */
export async function getPublishableColoriages(locale: 'fr' | 'en') {
  const all = await getCollection('coloriages', ({ data }) => data.locale === locale);
  return all.filter((c) => {
    const imagePath = join(process.cwd(), 'public', c.data.image);
    // Accept both the original PNG and the optimized WebP
    const webpPath = imagePath.replace(/\.png$/, '.webp');
    return existsSync(imagePath) || existsSync(webpPath);
  });
}
