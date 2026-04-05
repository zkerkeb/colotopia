import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Coloriages are now served from PostgreSQL + Cloudflare R2 CDN.
 * Only the blog collection remains as a content collection.
 */

const blogCategories = [
  'benefits',
  'tips',
  'seasonal',
  'age-groups',
  'themes',
] as const;

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: ({ data }) => `${data.locale}/${data.slug}`,
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    locale: z.enum(['fr', 'en']),
    date: z.string(),
    author: z.string().default('Colotopia'),
    category: z.enum(blogCategories),
    seoTitle: z.string(),
    seoDescription: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
