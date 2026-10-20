import { canonicalCategory } from './catalog';

// These files have been visually reviewed. Vite fingerprints their URLs so
// replacing an illustration cannot reuse an old browser/CDN cache entry.
const artwork = import.meta.glob<string>('../assets/category-artwork/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function categoryArtwork(slug: string): string {
  const image = artwork[`../assets/category-artwork/${canonicalCategory(slug)}.webp`];
  if (!image) throw new Error(`Missing reviewed category artwork: ${slug}`);
  return image;
}
