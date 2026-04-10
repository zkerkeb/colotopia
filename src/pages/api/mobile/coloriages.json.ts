/**
 * Mobile API endpoint — returns all coloring pages with CDN URLs.
 * Pre-rendered at build time as static JSON.
 *
 * GET /api/mobile/coloriages.json
 */
import { getPublishableColoriages } from '../../../lib/coloriages';
import { getCategoryLabel } from '../../../lib/i18n';
import { cdnPng, cdnThumb } from '../../../lib/cdn';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const [frPages, enPages] = await Promise.all([
    getPublishableColoriages('fr'),
    getPublishableColoriages('en'),
  ]);

  const coloriages = frPages.map((c) => ({
    id: c.id,
    slug: c.data.slug,
    title: c.data.title,
    category: c.data.category,
    categoryLabel: getCategoryLabel(c.data.category, 'fr'),
    audience: c.data.audience,
    tags: c.data.tags,
    image: c.data.image, // Full-size PNG from CDN
    thumbnail: cdnThumb(c.data.slug.replace(/-/g, '-')),
    printable: c.data.printable,
    createdAt: c.data.createdAt,
  }));

  // Deduce thumbnail URL from image_path key
  // CDN structure: /coloriages/thumbs/{key}.webp
  const corrected = frPages.map((c) => {
    // Extract the key from the full PNG URL
    const imageUrl = c.data.image; // https://cdn.colotopia.com/coloriages/{key}.png
    const key = imageUrl.replace('https://cdn.colotopia.com/coloriages/', '').replace('.png', '');
    return {
      id: c.id,
      slug: c.data.slug,
      title: c.data.title,
      category: c.data.category,
      categoryLabel: getCategoryLabel(c.data.category, 'fr'),
      audience: c.data.audience,
      tags: c.data.tags,
      image: imageUrl,
      thumbnail: cdnThumb(key),
      printable: c.data.printable,
      createdAt: c.data.createdAt,
    };
  });

  return new Response(JSON.stringify(corrected), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
