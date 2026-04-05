import { db } from '../db';
import { colorings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { cdnPng } from './cdn';

/**
 * Shape expected by every page and component.
 * Mirrors the old Astro content-collection entry so existing templates
 * keep working with `c.data.*` access.
 */
export interface ColoringData {
  title: string;
  slug: string;
  category: string;
  audience: string;
  tags: string[];
  image: string;   // CDN PNG URL (full-size)
  alt: string;
  locale: string;
  seoTitle?: string;
  seoDescription?: string;
  printable: boolean;
  createdAt?: string;
}

export interface ColoringEntry {
  id: string;
  data: ColoringData;
}

/**
 * Returns publishable coloriages for a given locale.
 * Drop-in replacement for the old YAML-based version.
 */
export async function getPublishableColoriages(locale: 'fr' | 'en'): Promise<ColoringEntry[]> {
  const rows = await db
    .select()
    .from(colorings)
    .where(eq(colorings.locale, locale));

  return rows.map((row) => ({
    id: `${row.locale}/${row.slug}`,
    data: {
      title: row.title,
      slug: row.slug,
      category: row.categorySlug,
      audience: row.audience,
      tags: (row.tagsJson as string[]) ?? [],
      image: cdnPng(row.imagePath),
      alt: row.alt ?? '',
      locale: row.locale,
      seoTitle: row.seoTitle ?? undefined,
      seoDescription: row.seoDescription ?? undefined,
      printable: row.printable,
      createdAt: row.createdAt?.toISOString().split('T')[0],
    },
  }));
}

/**
 * Builds a FR ↔ EN slug mapping using the shared image key.
 */
export async function buildSlugMap(): Promise<{
  frToEn: Record<string, string>;
  enToFr: Record<string, string>;
}> {
  const frPages = await getPublishableColoriages('fr');
  const enPages = await getPublishableColoriages('en');

  const imageToFr: Record<string, string> = {};
  for (const c of frPages) {
    imageToFr[c.data.image] = c.data.slug;
  }

  const frToEn: Record<string, string> = {};
  const enToFr: Record<string, string> = {};

  for (const c of enPages) {
    const frSlug = imageToFr[c.data.image];
    if (frSlug) {
      frToEn[frSlug] = c.data.slug;
      enToFr[c.data.slug] = frSlug;
    }
  }

  return { frToEn, enToFr };
}
