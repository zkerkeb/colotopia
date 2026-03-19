import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const categories = [
  'animaux',
  'vehicules',
  'nature',
  'alphabet',
  'saisons',
  'fetes',
] as const;

const coloriages = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/coloriages' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    category: z.enum(categories),
    tags: z.array(z.string()).default([]),
    image: z.string(),
    alt: z.string(),
    locale: z.enum(['fr', 'en']),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    printable: z.boolean().default(true),
  }),
});

export const collections = { coloriages };
