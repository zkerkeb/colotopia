import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const categories = [
  // Kids
  'animaux',
  'animaux-marins',
  'ferme',
  'vehicules',
  'nature',
  'alphabet',
  'dinosaures',
  'super-heros',
  'espace',
  'princesses-chevaliers',
  'metiers',
  'sport',
  'saisons',
  'fetes',
  'personnages',
  'contes',
  'drole',
  'musique',
  'nourriture',
  'pirates',
  'robots',
  // Adults
  'mandalas',
  'mosaiques',
  'abstrait',
  'cartes',
  'paysages',
] as const;

const audiences = ['enfants', 'adultes'] as const;

const coloriages = defineCollection({
  loader: glob({
    pattern: '**/*.yaml',
    base: './src/content/coloriages',
    generateId: ({ data }) => `${data.locale}/${data.slug}`,
  }),
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
