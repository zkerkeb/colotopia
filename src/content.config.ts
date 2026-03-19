import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const categories = [
  // Kids
  'animaux',
  'vehicules',
  'nature',
  'alphabet',
  'saisons',
  'fetes',
  'super-heros',
  'dinosaures',
  'espace',
  'personnages',
  'contes',
  // Adults
  'mandalas',
  'mosaiques',
  'abstrait',
  'cartes',
  'paysages',
] as const;

const audiences = ['enfants', 'adultes'] as const;

const coloriages = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/coloriages' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    category: z.enum(categories),
    audience: z.enum(audiences).default('enfants'),
    tags: z.array(z.string()).default([]),
    image: z.string(),
    alt: z.string(),
    locale: z.enum(['fr', 'en']),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    printable: z.boolean().default(true),
    createdAt: z.string().optional(),
  }),
});

export const collections = { coloriages };
