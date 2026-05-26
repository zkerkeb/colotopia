/**
 * CDN URL helpers for Cloudflare R2.
 * Central place to build image URLs — used by components, pages and the API.
 */

export const CDN_BASE = 'https://cdn.colotopia.com';

/* ── Builders from image key ──────────────────────────────── */

/** Full-size PNG (used for PDF generation & OG images) */
export function cdnPng(key: string): string {
  const normalized = normalizeColoringKey(key);
  return normalized ? `${CDN_BASE}/coloriages/${normalized}.png` : key;
}

/** Full-size WebP (used for on-page display) */
export function cdnWebp(key: string): string {
  const normalized = normalizeColoringKey(key);
  return normalized ? `${CDN_BASE}/coloriages/${normalized}.webp` : key;
}

/** Thumbnail WebP 300px (used for cards & grids) */
export function cdnThumb(key: string): string {
  const normalized = normalizeColoringKey(key);
  return normalized ? `${CDN_BASE}/coloriages/thumbs/${normalized}.webp` : key;
}

/** Category banner */
export function cdnBanner(slug: string): string {
  return `${CDN_BASE}/banners/${slug}.png`;
}

/** Category icon */
export function cdnCategoryIcon(slug: string): string {
  return `${CDN_BASE}/category-icons/${slug}.png`;
}

/* ── Universal derivation helpers ─────────────────────────── */
/* Work with *any* image URL (CDN or legacy /images/ paths).  */

/** PNG → WebP (same directory) */
export function toWebp(pngUrl: string): string {
  return pngUrl.replace(/\.png$/, '.webp');
}

/** Any coloring URL → its thumbnail WebP */
export function toThumb(imageUrl: string): string {
  return imageUrl
    .replace(/\.png$/, '.webp')
    .replace(/\/coloriages\/(?!thumbs\/)/, '/coloriages/thumbs/');
}

function normalizeColoringKey(input: string): string | null {
  const value = input.trim().split(/[?#]/)[0];
  if (!value) return null;
  if (/^https?:\/\//.test(value) && !value.startsWith(CDN_BASE)) return null;

  return value
    .replace(CDN_BASE, '')
    .replace(/^\/+/, '')
    .replace(/^(images\/coloriages|coloriages\/thumbs|coloriages)\//, '')
    .replace(/\.(png|webp|jpe?g)$/i, '');
}
