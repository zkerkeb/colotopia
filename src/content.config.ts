import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCategories = [
  'benefits',
  'tips',
  'seasonal',
  'age-groups',
  'themes',
] as const;

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
  'kawaii',
  'licorne',
  'fleurs',
  'chats',
  'papillons',
  'bold-et-facile',
  'paques',
  'halloween',
  'noel',
  'champignons',
  // Adults
  'cottagecore',
  'vitrail',
  'zodiaque',
  'affirmations',
  'anti-stress',
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

export const collections = { coloriages, blog };
