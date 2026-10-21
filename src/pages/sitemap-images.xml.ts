import type { APIRoute } from 'astro';
import { getPublishableColoriages } from '../lib/coloriages';
import { toWebp } from '../lib/cdn';

const xml = (value: string) => value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);
export const GET: APIRoute = async () => {
  const pages = (await Promise.all([getPublishableColoriages('fr'), getPublishableColoriages('en')])).flat();
  const entries = pages.map(({ data }) => `<url><loc>${xml(`https://colotopia.com/${data.locale}/${data.locale === 'fr' ? 'coloriage' : 'coloring'}/${data.slug}/`)}</loc>${data.updatedAt ? `<lastmod>${xml(data.updatedAt)}</lastmod>` : ''}<image:image><image:loc>${xml(toWebp(data.image))}</image:loc></image:image></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
