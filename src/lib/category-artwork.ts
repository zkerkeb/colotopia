import { canonicalCategory } from './catalog';
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

// These files have been visually reviewed. Vite fingerprints their URLs so
// replacing an illustration cannot reuse an old browser/CDN cache entry.
const artwork = import.meta.glob<ImageMetadata>('../assets/category-artwork/*.webp', {
  eager: true,
  import: 'default',
});

export function categoryArtwork(slug: string): string {
  const image = artwork[`../assets/category-artwork/${canonicalCategory(slug)}.webp`];
  if (!image) throw new Error(`Missing reviewed category artwork: ${slug}`);
  return image.src;
}

const previews = new Map<string, ReturnType<typeof getImage>>();
export function categoryArtworkPreview(image: string) {
  if (!previews.has(image)) {
    const source = Object.values(artwork).find(item => item.src === image);
    if (!source) throw new Error(`Unreviewed category image: ${image}`);
    previews.set(image, getImage({ src: source, width: 300, widths: [160, 300, 600], format: 'webp', quality: 90 }));
  }
  return previews.get(image)!;
}
