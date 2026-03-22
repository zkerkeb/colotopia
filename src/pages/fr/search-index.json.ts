import { getPublishableColoriages } from '../../lib/coloriages';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const coloriages = await getPublishableColoriages('fr');
  const index = coloriages.map((c) => ({
    title: c.data.title,
    slug: c.data.slug,
    tags: c.data.tags,
    category: c.data.category,
    url: `/fr/coloriage/${c.data.slug}`,
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
