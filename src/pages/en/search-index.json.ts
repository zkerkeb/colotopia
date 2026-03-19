import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const coloriages = await getCollection('coloriages', ({ data }) => data.locale === 'en');
  const index = coloriages.map((c) => ({
    title: c.data.title,
    slug: c.data.slug,
    tags: c.data.tags,
    category: c.data.category,
    url: `/en/coloring/${c.data.slug}`,
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
