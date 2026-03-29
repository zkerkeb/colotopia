import { getPublishableColoriages } from '../../lib/coloriages';
import { getCategoryLabel } from '../../lib/i18n';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const coloriages = await getPublishableColoriages('en');
  const index = coloriages.map((c) => ({
    title: c.data.title,
    slug: c.data.slug,
    tags: c.data.tags,
    category: c.data.category,
    categoryLabel: getCategoryLabel(c.data.category, 'en'),
    url: `/en/coloring/${c.data.slug}`,
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
