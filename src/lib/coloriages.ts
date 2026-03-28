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
    // Also require the thumbnail used by ColoringCard
    const thumbPath = imagePath
      .replace('/images/coloriages/', '/images/coloriages/thumbs/')
      .replace(/\.png$/, '.webp');
    const hasSource = existsSync(imagePath) || existsSync(webpPath);
    const hasThumb = existsSync(thumbPath);
    return hasSource && hasThumb;
  });
}

/**
 * Builds a mapping of FR slug → EN slug and EN slug → FR slug,
 * using the shared image path as the linking key.
 */
export async function buildSlugMap(): Promise<{ frToEn: Record<string, string>; enToFr: Record<string, string> }> {
  const frPages = await getPublishableColoriages('fr');
  const enPages = await getPublishableColoriages('en');

  const imageToFr: Record<string, string> = {};
  for (const c of frPages) {
    imageToFr[c.data.image] = c.data.slug;
  }

  const frToEn: Record<string, string> = {};
  const enToFr: Record<string, string> = {};

  for (const c of enPages) {
    const frSlug = imageToFr[c.data.image];
    if (frSlug) {
      frToEn[frSlug] = c.data.slug;
      enToFr[c.data.slug] = frSlug;
    }
  }

  return { frToEn, enToFr };
}
